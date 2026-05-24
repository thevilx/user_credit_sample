import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
    // App
    NODE_ENV: Joi.string()
        .valid('development', 'production', 'test')
        .default('development'),
    PORT: Joi.number().default(3000),
    CORS_ORIGINS: Joi.string().default('http://localhost:3000'),

    // Database
    DATABASE_URL: Joi.string().required(),

    // JWT
    JWT_SECRET: Joi.string().min(32).required(),
    JWT_EXPIRES_IN: Joi.string().default('1d'),
    JWT_REFRESH_SECRET: Joi.string().min(32).required(),
    JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

    // Redis
    REDIS_HOST: Joi.string().default('localhost'),
    REDIS_PORT: Joi.number().default(6379),
    REDIS_PASSWORD: Joi.string().allow(null).default(null),
    REDIS_DB: Joi.number().default(0),

    // Email
    EMAIL_HOST: Joi.string().required(),
    EMAIL_PORT: Joi.number().default(587),
    EMAIL_USER: Joi.string().required(),
    EMAIL_PASSWORD: Joi.string().required(),
    EMAIL_FROM: Joi.string().email().required(),
});