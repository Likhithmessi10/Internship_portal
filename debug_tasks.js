const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const student = await prisma.studentProfile.findFirst({
    where: { fullName: { contains: 'Likhith', mode: 'insensitive' } },
    include: {
      applications: true,
      workAssignments: true
    }
  });

  if (!student) {
    console.log('Student not found');
    return;
  }

  console.log('Student:', {
    id: student.id,
    fullName: student.fullName,
    userId: student.userId
  });

  console.log('Applications:', student.applications.map(a => ({ id: a.id, status: a.status, mentorId: a.mentorId })));
  console.log('Work Assignments (directly linked to student):', student.workAssignments.map(w => ({ id: w.id, title: w.title, status: w.status, applicationId: w.applicationId })));

  // Also check assignments linked via applications
  const appIds = student.applications.map(a => a.id);
  const assignmentsViaApp = await prisma.workAssignment.findMany({
    where: { applicationId: { in: appIds } }
  });
  console.log('Work Assignments (via applications):', assignmentsViaApp.map(w => ({ id: w.id, title: w.title, status: w.status, applicationId: w.applicationId })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
