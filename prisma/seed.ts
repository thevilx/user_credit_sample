// prisma/seed.ts
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/user_credit_payment_test',
});

const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Starting database seeding...');

    // Create dummy users
    const user1 = await prisma.user.upsert({
        where: { email: 'alice@example.com' },
        update: {},
        create: {
            email: 'alice@example.com',
            name: 'Alice Smith',
            balance: 1000.00,
        },
    });
    console.log(`Created/Updated user: ${user1.name} with ID: ${user1.id}`);

    const user2 = await prisma.user.upsert({
        where: { email: 'bob@example.com' },
        update: {},
        create: {
            email: 'bob@example.com',
            name: 'Bob Johnson',
            balance: 500.50,
        },
    });
    console.log(`Created/Updated user: ${user2.name} with ID: ${user2.id}`);

    const user3 = await prisma.user.upsert({
        where: { email: 'charlie@example.com' },
        update: {},
        create: {
            email: 'charlie@example.com',
            name: 'Charlie Brown',
            balance: 200.00,
        },
    });
    console.log(`Created/Updated user: ${user3.name} with ID: ${user3.id}`);

    console.log('Database seeding complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
