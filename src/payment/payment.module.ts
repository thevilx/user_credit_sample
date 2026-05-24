import { Module } from '@nestjs/common';
import { PaymentsService } from './payment.service';
import { PaymentsController } from './payment.controller';
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module';
import { PaymentProcessor } from '../workers/payment.processor';

@Module({
  controllers: [PaymentsController, PaymentProcessor],
  providers: [PaymentsService],
  imports: [RabbitMQModule],
})
export class PaymentModule { }
