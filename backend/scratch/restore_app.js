const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function restoreApplication() {
    try {
        const appId = 'c40a1578-3170-4e74-ae19-22ca3bbb4ee0';
        const updated = await prisma.application.update({
            where: { id: appId },
            data: {
                status: 'SELECTED',
                updatedAt: new Date()
            }
        });

        console.log('Successfully restored application:', JSON.stringify(updated, null, 2));

        // Also add an audit log for this manual restoration
        await prisma.auditLog.create({
            data: {
                action: 'STATUS_RESTORE',
                userEmail: 'antigravity-ai@system.com',
                details: 'Restored application from REJECTED back to SELECTED as per user request.',
                target: appId
            }
        });

    } catch (error) {
        console.error('Error restoring application:', error);
    } finally {
        await prisma.$disconnect();
    }
}

restoreApplication();
