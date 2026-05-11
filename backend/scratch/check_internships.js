const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  const batches = await prisma.internshipBatch.findMany({
    include: {
      internships: true
    }
  });
  console.log('Batches found:', batches.length);
  batches.forEach(b => {
    console.log(`Batch: ${b.title}, Internships: ${b.internships.length}, Active: ${b.isActive}`);
    b.internships.forEach(i => {
      console.log(`  - Internship: ${i.title}, Active: ${i.isActive}, Deadline: ${i.applicationDeadline}`);
    });
  });

  const internshipsWithoutBatch = await prisma.internship.findMany({
    where: { batchId: null }
  });
  console.log('Internships without batch:', internshipsWithoutBatch.length);

  await prisma.$disconnect();
}

checkData();
