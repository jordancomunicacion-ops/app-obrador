import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { uploadPhoto } from "@/app/lib/storage/spaces";

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB hard limit before compression
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  const prefix = (form.get("prefix") as string | null) ?? "photos";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large" }, { status: 413 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: `Unsupported type: ${file.type}` }, { status: 415 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const photo = await uploadPhoto(buffer, { prefix });

  return NextResponse.json(photo);
}
