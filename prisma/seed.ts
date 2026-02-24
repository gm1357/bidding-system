import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client';
import { faker } from '@faker-js/faker';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  console.log('Creating collections...');
  for (let i = 0; i < 100; i++) {
    await prisma.collection.create({
      data: {
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        stock: faker.number.int({ min: 1, max: 1000 }),
        price: faker.number.int({ min: 500, max: 100000 }),
      },
    });
  }
  console.log('Collections created successfully!');

  console.log('Creating users...');
  for (let i = 0; i < 10; i++) {
    await prisma.user.create({
      data: {
        name: faker.person.firstName(),
        email: faker.internet.email(),
      },
    });
  }
  console.log('Users created successfully!');

  console.log('Fetching collections and users...');
  const collections = await prisma.collection.findMany();
  const users = await prisma.user.findMany();

  console.log('Creating bids...');
  for (const collection of collections) {
    for (let i = 0; i < 10; i++) {
      await prisma.bid.create({
        data: {
          collectionId: collection.id,
          userId: users[i].id,
          price: faker.number.int({ min: 500, max: 100000 }),
        },
      });
    }
  }
  console.log('Bids created successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
    console.log('Seeding completed successfully!');
  })
  .catch(async e => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
