import { IsUUID, IsNumber, Min } from 'class-validator';

export class CreditUserDto {
    @IsUUID()
    userId: string;

    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0.01)
    amount: number;
}
