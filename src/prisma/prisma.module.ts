import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ConfigModule } from '../config/config.modules';

@Global()  // makes it available everywhere without importing
@Module({
    imports: [ConfigModule],  // Import ConfigModule to access DatabaseConfigService
    providers: [PrismaService],
    exports: [PrismaService],
})
export class PrismaModule { }