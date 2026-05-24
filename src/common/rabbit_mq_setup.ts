import * as amqp from 'amqplib';

export async function setupRabbitMQTopology() {
    const conn = await amqp.connect(process.env.RABBITMQ_URL);
    const ch = await conn.createChannel();

    // ── Main exchange & queue ──────────────────────────────────────
    await ch.assertExchange('payment', 'direct', { durable: true });

    await ch.assertQueue('payment_queue', {
        durable: true,
        arguments: {
            'x-dead-letter-exchange': 'payment_retry',
            'x-dead-letter-routing-key': 'payment_retry', // ← where NACKed msgs go
        },
    });

    // ✅ Bind main queue to main exchange
    await ch.bindQueue('payment_queue', 'payment', 'payment_queue');

    // ── Retry exchange & queue ─────────────────────────────────────
    await ch.assertExchange('payment_retry', 'direct', { durable: true });

    await ch.assertQueue('payment_retry_queue', {
        durable: true,
        arguments: {
            'x-message-ttl': 10000,                        // 10s backoff
            'x-dead-letter-exchange': 'payment',           // after TTL → back to main
            'x-dead-letter-routing-key': 'payment_queue',  // lands in payment_queue
        },
    });

    // ✅ Routing key matches what payment_queue sends on NACK
    await ch.bindQueue('payment_retry_queue', 'payment_retry', 'payment_retry');

    await ch.close();
    await conn.close();
}