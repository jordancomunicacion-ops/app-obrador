
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'gerencia@sotodelprior.com';
    console.log(`Checking SPECIFIC user: ${email}...`);

    const user = await prisma.user.findUnique({
        where: { email: email }
    });

    if (!user) {
        console.log('User gerencia NOT FOUND. Creating it...');
        // Create user logic here if needed, or just report it.
        // For now, let's just create it to be helpful.
        const bcrypt = require('bcryptjs'); // might not be available in simple script context if not installed in node_modules? 
        // Actually it is in package.json.
        const hashedPassword = await bcrypt.hash('123456', 10);

        const newUser = await prisma.user.create({
            data: {
                name: 'Gerencia',
                email: email,
                password: hashedPassword,
                role: 'ADMIN',
                approved: true
            }
        });
        console.log('Created Gerencia:', newUser);
    } else {
        console.log('User FOUND:', { id: user.id, email: user.email, role: user.role, adminId: user.adminId });
        if (user.role !== 'ADMIN' || user.adminId !== null) {
            console.log('Fixing role/adminId...');
            const updated = await prisma.user.update({
                where: { id: user.id },
                data: { role: 'ADMIN', adminId: null, approved: true }
            });
            console.log('Fixed:', updated);
        } else {
            console.log('User is CORRECTLY configured as ADMIN.');
        }
    }
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
