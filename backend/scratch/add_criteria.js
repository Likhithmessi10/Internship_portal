const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const internships = await prisma.internship.findMany({
        include: { evaluationCriteria: true }
    });

    for (const internship of internships) {
        if (internship.evaluationCriteria.length === 0) {
            await prisma.internshipEvaluationCriteria.createMany({
                data: [
                    {
                        internshipId: internship.id,
                        question: "Technical Skills & Domain Knowledge",
                        maxScore: 50
                    },
                    {
                        internshipId: internship.id,
                        question: "Communication & Problem Solving",
                        maxScore: 50
                    }
                ]
            });
            console.log(`Added default criteria to internship: ${internship.title}`);
        }
    }
    console.log("Done!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
