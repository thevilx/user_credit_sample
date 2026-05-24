// // src/workers/payment.processor.ts
// import { Controller, Logger } from '@nestjs/common';
// import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
// import { PrismaService } from '../prisma/prisma.service';
// import { RedisService } from '../redis/redis.service';
// import { EventType, PaymentStatus, TransactionType } from '@prisma/client';

// const MAX_RETRIES = 3;

// @Controller()
// export class PaymentProcessor {
//     private readonly logger = new Logger(PaymentProcessor.name);

//     constructor(
//         private prisma: PrismaService,
//         private redis: RedisService,
//     ) { }

//     @EventPattern('process_payment')
//     async handlePayment(
//         @Payload() data: { paymentRequestId: string },
//         @Ctx() context: RmqContext,
//     ) {
//         const channel = context.getChannelRef();
//         const message = context.getMessage();

//         const pr = await this.prisma.paymentRequest.findUnique({
//             where: { id: data.paymentRequestId },
//             include: { user: true },
//         });

//         if (!pr) {
//             channel.ack(message);
//             return;
//         }

//         if (([PaymentStatus.SUCCEEDED, PaymentStatus.FAILED, PaymentStatus.CANCELLED] as any).includes(pr.status)) {
//             channel.ack(message);
//             return;
//         }

//         await this.updateStatus(pr.id, PaymentStatus.PROCESSING, EventType.PROCESSING_STARTED);

//         let lock;
//         try {
//             lock = await this.redis.acquireLock(`user:${pr.userId}`, 8000);

//             if (Math.random() < 0.05) {
//                 throw new Error('Simulated transient technical failure');
//             }

//             if (pr.reference.includes('FAIL')) {
//                 await this.failPayment(pr.id, 'Reference pattern forced failure');
//                 channel.ack(message);
//                 return;
//             }

//             if (this.simulateAmountFailure(pr.amount)) {
//                 await this.failPayment(pr.id, 'High-value payment risk check failed');
//                 channel.ack(message);
//                 return;
//             }

//             const result = await this.prisma.$transaction(async (tx) => {

//                 // baraye inke lock beshe row raw query neveshte shode
//                 const users = await tx.$queryRaw<Array<{ balance: string }>>`
//                     SELECT balance FROM "User" WHERE id = ${pr.userId} FOR UPDATE
//                 `;

//                 const user = users[0];

//                 if (!user || Number(user.balance) < Number(pr.amount)) {
//                     return { success: false, reason: 'Insufficient balance' };
//                 }

//                 await tx.user.update({
//                     where: { id: pr.userId },
//                     data: { balance: { decrement: pr.amount } },
//                 });

//                 await tx.paymentRequest.update({
//                     where: { id: pr.id },
//                     data: { status: PaymentStatus.SUCCEEDED },
//                 });

//                 await tx.transaction.create({
//                     data: {
//                         userId: pr.userId,
//                         paymentRequestId: pr.id,
//                         amount: pr.amount,
//                         type: TransactionType.DEBIT,
//                         reference: pr.reference,
//                     },
//                 });

//                 await tx.paymentEvent.create({
//                     data: { paymentRequestId: pr.id, type: EventType.SUCCEEDED },
//                 });

//                 return { success: true };
//             });

//             if (!result.success) {
//                 await this.failPayment(pr.id, result.reason);
//             }

//             channel.ack(message);

//         } catch (err: any) {
//             this.logger.error(`Technical failure for ${pr.id}: ${err.message}`);

//             if (pr.retryCount < MAX_RETRIES) {
//                 await this.prisma.paymentRequest.update({
//                     where: { id: pr.id },
//                     data: {
//                         retryCount: { increment: 1 },
//                         status: PaymentStatus.QUEUED,
//                     },
//                 });
//                 await this.prisma.paymentEvent.create({
//                     data: {
//                         paymentRequestId: pr.id,
//                         type: EventType.RETRY_TRIGGERED,
//                         metadata: { attempt: pr.retryCount + 1, error: err.message },
//                     },
//                 });
//                 // NACK without requeue — let RabbitMQ DLQ + retry exchange handle backoff
//                 channel.nack(message, false, false);
//             } else {
//                 await this.failPayment(pr.id, `Max retries exceeded: ${err.message}`);
//                 channel.ack(message);
//             }

//         } finally {
//             await lock?.release().catch(() => { });
//         }
//     }

//     // amount comes in as Decimal from Prisma — convert to number only for comparison
//     private simulateAmountFailure(amount: any): boolean {
//         const n = Number(amount);
//         if (n > 10000) return Math.random() < 0.8;
//         if (n > 5000) return Math.random() < 0.4;
//         if (n > 1000) return Math.random() < 0.15;
//         return false;
//     }

//     private async updateStatus(id: string, status: PaymentStatus, event: EventType) {
//         await this.prisma.$transaction([
//             this.prisma.paymentRequest.update({ where: { id }, data: { status } }),
//             this.prisma.paymentEvent.create({ data: { paymentRequestId: id, type: event } }),
//         ]);
//     }

//     private async failPayment(id: string, reason: string) {
//         await this.prisma.$transaction([
//             this.prisma.paymentRequest.update({
//                 where: { id },
//                 data: { status: PaymentStatus.FAILED, failureReason: reason },
//             }),
//             this.prisma.paymentEvent.create({
//                 data: {
//                     paymentRequestId: id,
//                     type: EventType.FAILED,
//                     metadata: { reason },
//                 },
//             }),
//         ]);
//     }
// }