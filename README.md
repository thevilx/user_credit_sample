# Asynchronous User Credit Payment Backend

## Overview
This project implements a backend service to manage user credit balances and process payment requests asynchronously. It uses NestJS, PostgreSQL (via Prisma), Redis for idempotency and locking, and RabbitMQ for asynchronous job processing.

## Functional Requirements Implemented
1.  **User Credit Balance Management**: Per-user balance maintained, with an API to credit user accounts.
2.  **Payment Request Submission**: API to submit payment requests, storing records with PENDING status, and placing them into a RabbitMQ queue for async processing.
3.  **Asynchronous Payment Processing Worker**: A background worker picks requests, checks balance, deducts atomically (or marks as FAILED), simulates failures, and ensures concurrency safety.
4.  **Payment Status Management**: Tracks and updates payment request status (PENDING, QUEUED, PROCESSING, SUCCEEDED, FAILED).
5.  **Transaction Records**: Records debit transactions for successful payments.
6.  **Event History**: Logs significant state changes for each payment request.
7.  **Retry Mechanism**: Implemented for technical failures with a defined retry policy (max 3 attempts, 10s backoff via RabbitMQ DLQ).
8.  **Minimal Admin Features**: API endpoints to list users with balances and list transactions for a specific user.

## Technical Stack
*   **Framework**: NestJS
*   **Database**: PostgreSQL
*   **ORM**: Prisma
*   **Caching/Locking**: Redis
*   **Message Broker**: RabbitMQ

## Project Setup

### Prerequisites
*   Node.js (LTS recommended)
*   Yarn or npm
*   Docker (for running PostgreSQL, Redis, and RabbitMQ locally)

### 1. Environment Variables
Create a `.env` file based on `.env.example` (or the provided `.env`) and update the values. Ensure your `DATABASE_URL`, `REDIS_HOST`, `REDIS_PORT`, and `RABBITMQ_URL` are correctly configured.

Example `.env` (adjust as needed):
```env
NODE_ENV=development
PORT=3000
API_PREFIX=api
CORS_ORIGINS=http://localhost:3000,http://localhost:4200

DATABASE_URL="postgresql://postgres:postgres@localhost:5432/user_credit_payment"

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=null

RABBITMQ_URL="amqp://guest:guest@localhost:5672"
```

### 2. Run Infrastructure with Docker Compose
It's recommended to run PostgreSQL, Redis, and RabbitMQ using Docker Compose. A `docker-compose.yml` file should be created at the project root with the following services:

```yaml
version: '3.8'
services:
  db:
    image: postgres:13
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: user_credit_payment
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:6-alpine
    restart: always
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redisdata:/data

  rabbitmq:
    image: rabbitmq:3-management-alpine
    restart: always
    ports:
      - "5672:5672"
      - "15672:15672" # RabbitMQ Management UI
    environment:
      RABBITMQ_DEFAULT_USER: guest
      RABBITMQ_DEFAULT_PASS: guest

volumes:
  pgdata:
  redisdata:
```

To start the services:
```bash
docker-compose up -d
```

### 3. Install Dependencies
```bash
yarn install
```

### 4. Prisma Migrations
Generate Prisma client and run migrations:
```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 5. Run the Application

#### Development
```bash
yarn run start:dev
```

#### Production
```bash
yarn run start:prod
```

## API Endpoints

### Payment Submission
*   **POST** `/payments`
    *   **Body**: `CreatePaymentDto` (userId, amount, reference, description)
    *   **Description**: Submits a new payment request for asynchronous processing.

### Get Payment Status
*   **GET** `/payments/:id`
    *   **Description**: Retrieves the status and event history of a specific payment request.

### Credit User Balance (Admin/Internal)
*   **POST** `/payments/credit`
    *   **Body**: `CreditUserDto` (userId, amount)
    *   **Description**: Credits a specified amount to a user's balance. (e.g., for seeding or recharging).

### List All Users with Balances (Admin/Internal)
*   **GET** `/payments/users`
    *   **Description**: Retrieves a list of all users and their current credit balances.

### List User Transactions (Admin/Internal)
*   **GET** `/payments/users/:userId/transactions`
    *   **Description**: Retrieves a list of all transactions (debits and credits) for a specific user.

## Worker Details
The `PaymentProcessor` (src/workers/payment.processor.ts) consumes `process_payment` messages from RabbitMQ.
It performs the following steps:
1.  Acquires a Redis lock for the user to prevent race conditions.
2.  Simulates transient technical failures and forced business failures based on amount/reference.
3.  Within a database transaction, it checks the user's balance using `SELECT ... FOR UPDATE` (row-level lock).
4.  If balance is sufficient, it decrements the balance, marks the payment as SUCCEEDED, and records a DEBIT transaction and a SUCCEEDED event.
5.  If balance is insufficient or a business failure occurs, it marks the payment as FAILED.
6.  For technical failures, it retries the message via RabbitMQ's Dead Letter Exchange mechanism with an exponential backoff.

## Future Enhancements
*   **Comprehensive Admin Panel**: A dedicated UI for managing users, payments, and generating detailed reports.
*   **Authentication/Authorization**: Secure API endpoints.
*   **More robust error handling and logging**.
*   **External Payment Gateway Integration** (e.g., Stripe, PayPal) for actual money transfers.
*   **Webhooks/Callbacks**: Notify external systems of payment status changes.
*   **Cancellation Mechanism**: Implement the optional CANCELLED status.
