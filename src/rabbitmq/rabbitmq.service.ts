import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { RmqContext } from '@nestjs/microservices';

@Injectable()
export class RabbitMQService implements OnModuleDestroy {
  private rmqClient: ClientProxy;

  constructor() {
    this.rmqClient = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL ?? 'amqp://localhost:5672'],
        queue: 'payment_queue',       // ← pick one name and stick with it
        noAck: true,                  // ← publisher doesn't manually ack
        noAssert: true,               // ← topology handles queue declaration
        queueOptions: { durable: true },
      },
    });
  }

  // removed onModuleInit — topology runs once in main.ts

  async onModuleDestroy() {
    await this.rmqClient.close();
  }

  get client(): ClientProxy {
    return this.rmqClient;
  }

  emit(pattern: string, data: any) {
    return this.rmqClient.emit(pattern, data);
  }

  ack(context: RmqContext) {
    const channel = context.getChannelRef();
    const message = context.getMessage();
    channel.ack(message);
  }

  nack(context: RmqContext, requeue: boolean = false) {
    const channel = context.getChannelRef();
    const message = context.getMessage();
    channel.nack(message, false, requeue);
  }
}