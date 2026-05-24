import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtConfigService {
    constructor(private configService: ConfigService) { }

    get secret(): string {
        return this.configService.get<string>('JWT_SECRET')!;
    }

    get expiresIn(): string {
        return this.configService.get<string>('JWT_EXPIRES_IN')!;
    }

    get refreshSecret(): string {
        return this.configService.get<string>('JWT_REFRESH_SECRET')!;
    }

    get refreshExpiresIn(): string {
        return this.configService.get<string>('JWT_REFRESH_EXPIRES_IN')!;
    }

    get accessTokenConfig() {
        return {
            secret: this.secret,
            expiresIn: this.expiresIn,
        };
    }

    get refreshTokenConfig() {
        return {
            secret: this.refreshSecret,
            expiresIn: this.refreshExpiresIn,
        };
    }
}