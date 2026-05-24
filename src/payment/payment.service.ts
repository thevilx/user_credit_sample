import { Injectable, Inject, ConflictException, NotFoundException, OnModuleInit } from '@nestjs/common';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { RedisService } from '../redis/redis.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreditUserDto } from './dto/credit-user.dto';
import { EventType, PaymentStatus, TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PaymentsService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private rmqClient: RabbitMQService,
  ) { }

  async onModuleInit() {
    await this.rmqClient.client.connect();
  }


  async submitPayment(dto: CreatePaymentDto) {
    // Idempotency check
    const isPaymentNew = await this.redis.setIdempotency(dto.reference);

    if (!isPaymentNew) {
      return this.prisma.paymentRequest.findUnique({
        where: { reference: dto.reference },
      });
    }

    const paymentRequest = await this.prisma.$transaction(async (tx) => {
      const pr = await tx.paymentRequest.create({
        data: {
          userId: dto.userId,
          amount: dto.amount,
          reference: dto.reference,
          description: dto.description,
          status: PaymentStatus.PENDING,
        },
      });

      await tx.paymentEvent.create({
        data: {
          paymentRequestId: pr.id,
          type: EventType.CREATED,
        },
      });

      return pr;
    });

    await firstValueFrom(
      this.rmqClient.emit('process_payment', {
        paymentRequestId: paymentRequest.id,
      }),
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.paymentRequest.update({
        where: { id: paymentRequest.id },
        data: { status: 'QUEUED' },
      });
      await tx.paymentEvent.create({
        data: { paymentRequestId: paymentRequest.id, type: EventType.QUEUED },
      });
    });

    return paymentRequest;
  }

  async getStatus(id: string) {
    return this.prisma.paymentRequest.findUnique({
      where: { id },
      include: { events: { orderBy: { createdAt: 'asc' } } },
    });
  }

  async creditUser(dto: CreditUserDto) {
    const { userId, amount } = dto;
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      await tx.user.update({
        where: { id: userId },
        data: { balance: { increment: amount } },
      });

      await tx.transaction.create({
        data: {
          userId,
          amount,
          type: TransactionType.CREDIT,
          reference: `credit-${Date.now()}`,
          paymentRequestId: null // Explicitly set to null for CREDIT transactions
        },
      });
      return tx.user.findUnique({ where: { id: userId } });
    });
  }

  async listUsers() {
    return this.prisma.user.findMany({
      select: { id: true, name: true, email: true, balance: true, createdAt: true },
    });
  }

  async listUserTransactions(userId: string) {
    const userExists = await this.prisma.user.count({ where: { id: userId } });
    if (!userExists) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}