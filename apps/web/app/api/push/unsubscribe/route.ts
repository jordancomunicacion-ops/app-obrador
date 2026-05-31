import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body?.endpoint || typeof body.endpoint !== "string") {
    return NextResponse.json({ error: "Invalid endpoint" }, { status: 400 });
  }
  await prisma.pushSubscription
    .delete({ where: { endpoint: body.endpoint } })
    .catch(() => {});
  return NextResponse.json({ ok: true });
}
