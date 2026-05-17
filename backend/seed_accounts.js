const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function seed() {
    try {
        console.log("Reading accounts.txt...");
        const data = fs.readFileSync(path.join(__dirname, 'accounts.txt'), 'utf8');
        const lines = data.split('\n');
        
        for (const line of lines) {
            if (!line.trim()) continue;
            
            const parts = line.split('|').map(p => p.trim());
            const rolePart = parts.find(p => p.startsWith('ROLE:'));
            const namePart = parts.find(p => p.startsWith('NAME:'));
            const emailPart = parts.find(p => p.startsWith('EMAIL:'));
            const pwdPart = parts.find(p => p.startsWith('PASSWORD:'));
            
            if (rolePart && emailPart && pwdPart) {
                const role = rolePart.replace('ROLE:', '').trim();
                const name = namePart ? namePart.replace('NAME:', '').trim() : '';
                const email = emailPart.replace('EMAIL:', '').trim();
                const password = pwdPart.replace('PASSWORD:', '').trim();
                
                const hashedPassword = await bcrypt.hash(password, 12);
                
                await prisma.user.upsert({
                    where: { email },
                    update: { role, name, password: hashedPassword },
                    create: { email, role, name, password: hashedPassword }
                });
                console.log(`✅ Upserted ${email} as ${role}`);
            }
        }
        console.log("🎉 Seeding completed successfully.");
    } catch (error) {
        console.error("❌ Seeding failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

seed();
