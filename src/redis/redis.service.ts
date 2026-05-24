// src/common/redis.service.ts
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import Redlock from 'redlock';

@Injectable()
export class RedisService implements OnModuleDestroy {
    private readonly client = new Redis(process.env.REDIS_URL);
    private readonly redlock = new Redlock([this.client], {
        retryCount: 5,
        retryDelay: 200,
    });

    async setIdempotency(key: string, ttlSeconds = 86400): Promise<boolean> {
        // Returns true if key was newly set (first time), false if already exists
        const result = await this.client.set(
            `idempotency:${key}`, '1', 'EX', ttlSeconds, 'NX'
        );
        return result === 'OK';
    }

    async acquireLock(resource: string, ttlMs = 5000) {
        return this.redlock.acquire([`lock:${resource}`], ttlMs);
    }

    async onModuleDestroy() {
        await this.client.quit();
    }
}