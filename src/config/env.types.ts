// src/config/env.types.ts
export enum NodeEnv {
    Development = 'development',
    Production = 'production',
    Test = 'test',
}

export interface DatabaseConfig {
    url: string;
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    sslEnabled: boolean;
    poolSize: number;
}

export interface JwtConfig {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
}

export interface AppConfig {
    nodeEnv: NodeEnv;
    port: number;
    apiPrefix: string;
    corsOrigins: string[];
}

export interface RedisConfig {
    host: string;
    port: number;
    password: string | null;
    db: number;
}

export interface EmailConfig {
    host: string;
    port: number;
    user: string;
    password: string;
    from: string;
}

// Complete env variables interface
export interface EnvVariables {
    // App
    NODE_ENV: NodeEnv;
    PORT: number;
    CORS_ORIGINS: string;

    // Database
    DATABASE_URL: string;
    DB_HOST: string;
    DB_PORT: number;
    DB_USERNAME: string;
    DB_PASSWORD: string;
    DB_NAME: string;
    DB_SSL_ENABLED: boolean;
    DB_POOL_SIZE: number;

    // JWT
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    JWT_REFRESH_SECRET: string;
    JWT_REFRESH_EXPIRES_IN: string;

    // Redis
    REDIS_HOST: string;
    REDIS_PORT: number;
    REDIS_PASSWORD: string | null;
    REDIS_DB: number;

    // Email
    EMAIL_HOST: string;
    EMAIL_PORT: number;
    EMAIL_USER: string;
    EMAIL_PASSWORD: string;
    EMAIL_FROM: string;
}