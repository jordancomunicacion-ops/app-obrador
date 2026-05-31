import { prisma } from '@/app/lib/prisma';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const email = 'admin@cocina.com';
        const password = 'admin';
        const name = 'Admin User';

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (!existingUser) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await prisma.user.create({
                data: {
                    email,
                    name,
                    password: hashedPassword,
                    role: 'ADMIN',
                },
            });
            return NextResponse.json({ message: `Created user: ${email}` });
        } else {
            return NextResponse.json({ message: `User ${email} already exists.` });
        }
    } catch (error: any) {
        console.error("SEED API ERROR:", error);
        console.error("DB URL:", process.env.DATABASE_URL);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
