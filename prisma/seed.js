const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  await prisma.listing.createMany({
    data: [
      { name: 'Ava', city: 'London', description: 'Demo listing', availability: 'Available', isPublished: true, price: 300, imageUrls: [] },
      { name: 'Mia', city: 'Paris', description: 'Demo listing', availability: 'Available', isPublished: true, price: 280, imageUrls: [] }
    ],
    skipDuplicates: true
  });
}

main().finally(async () => prisma.$disconnect());
