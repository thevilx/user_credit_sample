import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { EventType, PaymentStatus, TransactionType } from '@prisma/client';

const MAX_RETRIES = 3;

@Controller()
export class PaymentProcessor {
    private readonly logger = new Logger(PaymentProcessor.name);

    constructor(
        private prisma: PrismaService,
        private redis: RedisService,
        private rabbitMQService: RabbitMQService,
    ) { }

    @EventPattern('process_payment')
    async handlePayment(
        @Payload() data: { paymentRequestId: string },
        @Ctx() context: RmqContext,
    ) {
        this.logger.log(`📥 Received: ${JSON.stringify(data)}`);

        // Guard: payload must exist
        if (!data?.paymentRequestId) {
            this.logger.error('❌ Invalid payload — missing paymentRequestId');
            this.rabbitMQService.ack(context);
            return;
        }

        const pr = await this.prisma.paymentRequest.findUnique({
            where: { id: data.paymentRequestId },
            include: { user: true },
        });

        if (!pr) {
            this.logger.warn(`⚠️ PaymentRequest not found: ${data.paymentRequestId}`);
            this.rabbitMQService.ack(context);
            return;
        }

        // Already in terminal state — skip
        if (([
            PaymentStatus.SUCCEEDED,
            PaymentStatus.FAILED,
            PaymentStatus.CANCELLED,
        ] as PaymentStatus[]).includes(pr.status)) {
            this.logger.warn(`⚠️ Already in terminal state: ${pr.status}`);
            this.rabbitMQService.ack(context);
            return;
        }

        await this.updateStatus(pr.id, PaymentStatus.PROCESSING, EventType.PROCESSING_STARTED);
        this.logger.log(`🔄 Processing payment: ${pr.id}`);

        let lock;
        try {
            lock = await this.redis.acquireLock(`user:${pr.userId}`, 8000);
            this.logger.log(`🔒 Lock acquired for user: ${pr.userId}`);

            // Simulated transient failure (5%)
            if (Math.random() < 0.05) {
                throw new Error('Simulated transient technical failure');
            }

            // Business rule failures → FAIL immediately, no retry
            if (pr.reference.includes('FAIL')) {
                this.logger.warn(`⚠️ Reference forced failure: ${pr.reference}`);
                await this.failPayment(pr.id, 'Reference pattern forced failure');
                this.rabbitMQService.ack(context);
                return;
            }

            if (this.simulateAmountFailure(pr.amount)) {
                this.logger.warn(`⚠️ Amount risk check failed: ${pr.amount}`);
                await this.failPayment(pr.id, 'High-value payment risk check failed');
                this.rabbitMQService.ack(context);
                return;
            }

            // Core transaction
            const result = await this.prisma.$transaction(async (tx) => {
                const users = await tx.$queryRaw<Array<{ balance: string }>>`
                    SELECT balance FROM "User" WHERE id = ${pr.userId} FOR UPDATE
                `;

                const user = users[0];
                if (!user || Number(user.balance) < Number(pr.amount)) {
                    return { success: false, reason: 'Insufficient balance' };
                }

                await tx.user.update({
                    where: { id: pr.userId },
                    data: { balance: { decrement: pr.amount } },
                });

                await tx.paymentRequest.update({
                    where: { id: pr.id },
                    data: { status: PaymentStatus.SUCCEEDED },
                });

                await tx.transaction.create({
                    data: {
                        userId: pr.userId,
                        paymentRequestId: pr.id,
                        amount: pr.amount,
                        type: TransactionType.DEBIT,
                        reference: pr.reference,
                    },
                });

                await tx.paymentEvent.create({
                    data: { paymentRequestId: pr.id, type: EventType.SUCCEEDED },
                });

                return { success: true };
            });

            if (!result.success) {
                this.logger.warn(`⚠️ Transaction failed: ${result.reason}`);
                await this.failPayment(pr.id, result.reason);
            } else {
                this.logger.log(`✅ Payment succeeded: ${pr.id}`);
            }

            this.rabbitMQService.ack(context);

        } catch (err: any) {
            this.logger.error(`💥 Technical failure for ${pr.id}: ${err.message}`);

            if (pr.retryCount < MAX_RETRIES) {
                this.logger.log(`🔁 Retrying (${pr.retryCount + 1}/${MAX_RETRIES}): ${pr.id}`);

                await this.prisma.paymentRequest.update({
                    where: { id: pr.id },
                    data: {
                        retryCount: { increment: 1 },
                        status: PaymentStatus.QUEUED,
                    },
                });

                await this.prisma.paymentEvent.create({
                    data: {
                        paymentRequestId: pr.id,
                        type: EventType.RETRY_TRIGGERED,
                        metadata: { attempt: pr.retryCount + 1, error: err.message },
                    },
                });

                this.rabbitMQService.nack(context, false); // → DLQ → retry exchange
            } else {
                this.logger.error(`🚫 Max retries exceeded: ${pr.id}`);
                await this.failPayment(pr.id, `Max retries exceeded: ${err.message}`);
                this.rabbitMQService.ack(context);
            }

        } finally {
            await lock?.release().catch(() => { });
        }
    }

    private simulateAmountFailure(amount: any): boolean {
        const n = Number(amount);
        if (n > 10000) return Math.random() < 0.8;
        if (n > 5000) return Math.random() < 0.4;
        if (n > 1000) return Math.random() < 0.15;
        return false;
    }

    private async updateStatus(id: string, status: PaymentStatus, event: EventType) {
        await this.prisma.$transaction([
            this.prisma.paymentRequest.update({ where: { id }, data: { status } }),
            this.prisma.paymentEvent.create({ data: { paymentRequestId: id, type: event } }),
        ]);
    }

    private async failPayment(id: string, reason: string) {
        await this.prisma.$transaction([
            this.prisma.paymentRequest.update({
                where: { id },
                data: { status: PaymentStatus.FAILED, failureReason: reason },
            }),
            this.prisma.paymentEvent.create({
                data: {
                    paymentRequestId: id,
                    type: EventType.FAILED,
                    metadata: { reason },
                },
            }),
        ]);
    }
}