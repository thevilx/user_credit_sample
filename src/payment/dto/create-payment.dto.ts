import { IsUUID, IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class CreatePaymentDto {
    @IsUUID()
    userId: string;

    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0.01)
    amount: number;

    @IsString()
    reference: string;  // idempotency key

    @IsString()
    @IsOptional()
    description?: string;
}