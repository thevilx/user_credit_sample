import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseConfigService {
    constructor(private configService: ConfigService) { }

    get databaseURL(): string {
        return this.configService.get<string>('DATABASE_URL')!;
    }

}