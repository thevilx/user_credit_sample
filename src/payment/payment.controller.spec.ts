import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController as PaymentController } from './payment.controller';
import { PaymentsService as PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreditUserDto } from './dto/credit-user.dto';
import { validate } from 'class-validator';

describe('PaymentController', () => {
  let controller: PaymentController;
  let service: PaymentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        {
          provide: PaymentService,
          useValue: {
            submitPayment: jest.fn(),
            creditUser: jest.fn(),
            getStatus: jest.fn(),
            listUsers: jest.fn(),
            listUserTransactions: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PaymentController>(PaymentController);
    service = module.get<PaymentService>(PaymentService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('submit payment validation', () => {
    it('should accept valid CreatePaymentDto', async () => {
      const validDto = new CreatePaymentDto();
      validDto.userId = '550e8400-e29b-41d4-a716-446655440000';
      validDto.amount = 15.99;
      validDto.reference = 'test-payment-ref';
      validDto.description = 'Test payment';

      const errors = await validate(validDto);
      expect(errors.length).toBe(0);
    });

    it('should reject CreatePaymentDto with invalid userId', async () => {
      const invalidDto = new CreatePaymentDto();
      invalidDto.userId = 'invalid-uuid-format';
      invalidDto.amount = 15.99;
      invalidDto.reference = 'test-payment-ref';

      const errors = await validate(invalidDto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('userId');
    });

    it('should reject CreatePaymentDto with amount below minimum', async () => {
      const invalidDto = new CreatePaymentDto();
      invalidDto.userId = '550e8400-e29b-41d4-a716-446655440000';
      invalidDto.amount = 0.005;
      invalidDto.reference = 'test-payment-ref';

      const errors = await validate(invalidDto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('amount');
    });

    it('should reject CreatePaymentDto with missing reference', async () => {
      const invalidDto = new CreatePaymentDto();
      invalidDto.userId = '550e8400-e29b-41d4-a716-446655440000';
      invalidDto.amount = 15.99;
      // reference is missing

      const errors = await validate(invalidDto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('reference');
    });
  });

  describe('credit user validation', () => {
    it('should reject CreditUserDto with amount having more than 2 decimal places', async () => {
      const invalidDto = new CreditUserDto();
      invalidDto.userId = '550e8400-e29b-41d4-a716-446655440000';
      invalidDto.amount = 50.255;

      const errors = await validate(invalidDto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('amount');
    });
  });

  describe('controller methods', () => {
    it('should call submitPayment with correct DTO', async () => {
      const dto = new CreatePaymentDto();
      dto.userId = '550e8400-e29b-41d4-a716-446655440000';
      dto.amount = 15.99;
      dto.reference = 'test-ref';
      dto.description = 'Test payment';

      await controller.submit(dto);
      expect(service.submitPayment).toHaveBeenCalledWith(dto);
    });

    it('should call creditUser with correct DTO', async () => {
      const dto = new CreditUserDto();
      dto.userId = '550e8400-e29b-41d4-a716-446655440000';
      dto.amount = 50.25;

      await controller.credit(dto);
      expect(service.creditUser).toHaveBeenCalledWith(dto);
    });

    it('should call listUsers', async () => {
      await controller.listUsers();
      expect(service.listUsers).toHaveBeenCalled();
    });

    it('should call listUserTransactions with correct userId', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      await controller.listUserTransactions(userId);
      expect(service.listUserTransactions).toHaveBeenCalledWith(userId);
    });

    it('should call getStatus with correct id', async () => {
      const id = 'test-id';
      await controller.status(id);
      expect(service.getStatus).toHaveBeenCalledWith(id);
    });
  });
});

it('should reject CreditUserDto with invalid userId', async () => {
  const invalidDto = new CreditUserDto();
  invalidDto.userId = 'not-a-valid-uuid';
  invalidDto.amount = 50.25;

  const errors = await validate(invalidDto);
  expect(errors.length).toBeGreaterThan(0);
  expect(errors[0].property).toBe('userId');
});

it('should reject CreditUserDto with amount below minimum', async () => {
  const invalidDto = new CreditUserDto();
  invalidDto.userId = '550e8400-e29b-41d4-a716-446655440000';
  invalidDto.amount = 0.001;

  const errors = await validate(invalidDto);
  expect(errors.length).toBeGreaterThan(0);
  expect(errors[0].property).toBe('amount');
});

it('should reject CreditUserDto with negative amount', async () => {
  const invalidDto = new CreditUserDto();
  invalidDto.userId = '550e8400-e29b-41d4-a716-446655440000';
  invalidDto.amount = -10.50;

  const errors = await validate(invalidDto);
  expect(errors.length).toBeGreaterThan(0);
  expect(errors[0].property).toBe('amount');
});

it('should reject CreditUserDto with amount having more than 2 decimal places', async () => {
  const invalidDto = new CreditUserDto();
  invalidDto.userId = '550e8400-e29b-41d4-a716-446655440000';
  invalidDto.amount = 50.255;

  const errors = await validate(invalidDto);
  expect(errors.length).toBeGreaterThan(0);
  expect(errors[0].property).toBe('amount');
});

