// src/payments/payments.controller.ts
import { Controller, Post, Body, Get, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { PaymentsService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreditUserDto } from './dto/credit-user.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) { }

  @Post()
  submit(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.submitPayment(dto);
  }

  @Get('/users')
  listUsers() {
    return this.paymentsService.listUsers();
  }

  @Get('/users/:userId/transactions')
  listUserTransactions(@Param('userId') userId: string) {
    return this.paymentsService.listUserTransactions(userId);
  }

  @Get(':id')
  status(@Param('id') id: string) {
    return this.paymentsService.getStatus(id);
  }

  @Post('/credit')
  @HttpCode(HttpStatus.OK)
  credit(@Body() dto: CreditUserDto) {
    return this.paymentsService.creditUser(dto);
  }


}