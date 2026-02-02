
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const EMAIL = 'worker_test_login@test.com'; // Use a test email
const PASSWORD = 'password123';
const ADMIN_EMAIL = 'gerencia@sotodelprior.com'; // Or any admin

async function main() {
    console.log("Starting Worker Login Debug...");

    // 1. Cleanup
    await prisma.user.deleteMany({ where: { email: EMAIL } });

    // 2. Create Worker (Simulate createUser)
    const admin = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
    if (!admin) {
        console.error("Admin not found for test context.");
        return;
    }

    const hashedPassword = await bcrypt.hash(PASSWORD, 10);
    const worker = await prisma.user.create({
        data: {
            name: "Test Worker",
            email: EMAIL,
            password: hashedPassword,
            role: "USER",
            approved: true, // Simulate approved=true
            adminId: admin.id,
            permissions: ["dashboard"]
        }
    });
    console.log(`Worker created: ${worker.email}, Approved: ${worker.approved}`);

    // 3. Simulate Login Check (Copy of auth.ts logic)
    const loginUser = await prisma.user.findUnique({ where: { email: EMAIL } });
    if (!loginUser) {
        console.error("Login: User not found!");
        return;
    }

    const passwordsMatch = await bcrypt.compare(PASSWORD, loginUser.password);
    console.log(`Password Match: ${passwordsMatch}`);

    if (!passwordsMatch) {
        console.error("Login: Invalid Password");
        return;
    }

    if (loginUser.email !== 'gerencia@sotodelprior.com' && !loginUser.approved) {
        console.error("Login: Not Approved (AccessDenied)");
        return;
    }

    console.log("Login SUCCESS!");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
