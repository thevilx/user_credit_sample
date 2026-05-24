import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NodeEnv } from '../env.types';

@Injectable()
export class AppConfigService {
    constructor(private configService: ConfigService) { }


    get nodeEnv(): NodeEnv {
        return this.configService.get<NodeEnv>('NODE_ENV')!;
    }

    get port(): number {
        return this.configService.get<number>('PORT')!;
    }


    get corsOrigins(): string[] {
        const origins = this.configService.get<string>('CORS_ORIGINS')!;
        return origins.split(',').map(origin => origin.trim());
    }

    get isDevelopment(): boolean {
        return this.nodeEnv === NodeEnv.Development;
    }

    get isProduction(): boolean {
        return this.nodeEnv === NodeEnv.Production;
    }

    get isTest(): boolean {
        return this.nodeEnv === NodeEnv.Test;
    }
}