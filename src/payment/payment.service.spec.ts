import { validate } from 'class-validator';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreditUserDto } from './dto/credit-user.dto';

describe('DTO Validation', () => {
  describe('CreatePaymentDto validation', () => {
    it('should pass validation with valid data', async () => {
      const dto = new CreatePaymentDto();
      dto.userId = '550e8400-e29b-41d4-a716-446655440000';
      dto.amount = 10.50;
      dto.reference = 'payment-ref-123';
      dto.description = 'Test payment';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation with invalid UUID', async () => {
      const dto = new CreatePaymentDto();
      dto.userId = 'invalid-uuid';
      dto.amount = 10.50;
      dto.reference = 'payment-ref-123';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isUuid');
    });

    it('should fail validation with amount less than minimum', async () => {
      const dto = new CreatePaymentDto();
      dto.userId = '550e8400-e29b-41d4-a716-446655440000';
      dto.amount = 0.005;
      dto.reference = 'payment-ref-123';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('min');
    });

    it('should fail validation with amount having more than 2 decimal places', async () => {
      const dto = new CreatePaymentDto();
      dto.userId = '550e8400-e29b-41d4-a716-446655440000';
      dto.amount = 10.505;
      dto.reference = 'payment-ref-123';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isNumber');
    });

    it('should fail validation with missing reference', async () => {
      const dto = new CreatePaymentDto();
      dto.userId = '550e8400-e29b-41d4-a716-446655440000';
      dto.amount = 10.50;
      // reference is missing

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('reference');
    });

    it('should pass validation with optional description missing', async () => {
      const dto = new CreatePaymentDto();
      dto.userId = '550e8400-e29b-41d4-a716-446655440000';
      dto.amount = 10.50;
      dto.reference = 'payment-ref-123';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('CreditUserDto validation', () => {
    it('should pass validation with valid data', async () => {
      const dto = new CreditUserDto();
      dto.userId = '550e8400-e29b-41d4-a716-446655440000';
      dto.amount = 25.75;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation with invalid UUID', async () => {
      const dto = new CreditUserDto();
      dto.userId = 'not-a-uuid';
      dto.amount = 25.75;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isUuid');
    });

    it('should fail validation with amount less than minimum', async () => {
      const dto = new CreditUserDto();
      dto.userId = '550e8400-e29b-41d4-a716-446655440000';
      dto.amount = 0.001;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('min');
    });

    it('should fail validation with amount having more than 2 decimal places', async () => {
      const dto = new CreditUserDto();
      dto.userId = '550e8400-e29b-41d4-a716-446655440000';
      dto.amount = 25.755;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isNumber');
    });

    it('should fail validation with negative amount', async () => {
      const dto = new CreditUserDto();
      dto.userId = '550e8400-e29b-41d4-a716-446655440000';
      dto.amount = -10.50;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('min');
    });
  });
});
