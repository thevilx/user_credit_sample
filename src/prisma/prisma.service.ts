import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { DatabaseConfigService } from '../config/modules/database.config';
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {

    constructor(DatabaseConfig: DatabaseConfigService) {
        const adapter = new PrismaPg({
            connectionString: DatabaseConfig.databaseURL,
        });
        super({ adapter });
    }

    async onModuleInit() {
        await this.$connect();
        console.log('Connected to PostgreSQL database');
    }

    async onModuleDestroy() {
        await this.$disconnect();
        console.log('Disconnected from PostgreSQL database');
    }
}