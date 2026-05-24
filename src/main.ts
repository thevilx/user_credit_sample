import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RmqOptions, Transport } from '@nestjs/microservices';
import { setupRabbitMQTopology } from './common/rabbit_mq_setup';

async function bootstrap() {
  // 1. Topology first — before anything else connects
  await setupRabbitMQTopology();

  const app = await NestFactory.create(AppModule);

  // 2. Consumer with noAssert so it doesn't redeclare the queue
  app.connectMicroservice<RmqOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL ?? 'amqp://localhost:5672'],
      queue: 'payment_queue',         // ← same name as publisher
      noAck: false,                   // ← consumer manually acks
      noAssert: true,                 // ← don't redeclare queue
      prefetchCount: 1,
      queueOptions: { durable: true },
    },
  });

  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();