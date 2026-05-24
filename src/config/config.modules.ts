// src/config/config.module.ts
import { Module, Global } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { configValidationSchema } from './config.validation';
import { AppConfigService } from './modules/app.config';
import { JwtConfigService } from './modules/jwt.config';
import { DatabaseConfigService } from './modules/database.config';

@Global()
@Module({
    imports: [
        NestConfigModule.forRoot({
            isGlobal: true,
            envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
            validationSchema: configValidationSchema,
            validationOptions: {
                abortEarly: true,
            },
            // Optional: Custom loaders for complex configs
            load: [
                () => ({
                    customConfig: {
                        someValue: process.env.CUSTOM_VALUE,
                    },
                }),
            ],
        }),
    ],
    providers: [AppConfigService, DatabaseConfigService, JwtConfigService],
    exports: [AppConfigService, DatabaseConfigService, JwtConfigService],
})
export class ConfigModule { }