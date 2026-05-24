import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PaymentModule } from './payment/payment.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { RabbitMQModule } from './rabbitmq/rabbitmq.module';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    RabbitMQModule,
    ConfigModule.forRoot(),
    PaymentModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
