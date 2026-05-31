import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { randomBytes } from "node:crypto";

const region = process.env.DO_SPACES_REGION!;
const endpoint = process.env.DO_SPACES_ENDPOINT!;
const bucket = process.env.DO_SPACES_BUCKET!;
const key = process.env.DO_SPACES_KEY!;
const secret = process.env.DO_SPACES_SECRET!;
const publicUrl = process.env.DO_SPACES_PUBLIC_URL!;
// Prefix por aplicación dentro del bucket compartido (cocina, crm, reservas, ...)
const appPrefix = (process.env.DO_SPACES_APP_PREFIX ?? "cocina").replace(/^\/+|\/+$/g, "");

const client = new S3Client({
  region,
  endpoint,
  credentials: { accessKeyId: key, secretAccessKey: secret },
  forcePathStyle: false,
});

export type UploadedPhoto = {
  url: string;
  key: string;
  width: number;
  height: number;
  bytes: number;
};

export async function uploadPhoto(
  file: Buffer | Uint8Array,
  options: { prefix?: string; maxWidth?: number } = {},
): Promise<UploadedPhoto> {
  const { prefix = "photos", maxWidth = 1280 } = options;

  const compressed = await sharp(file)
    .rotate()
    .resize({ width: maxWidth, withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });

  const cleanPrefix = prefix.replace(/^\/+|\/+$/g, "");
  const objectKey = `${appPrefix}/${cleanPrefix}/${Date.now()}-${randomBytes(6).toString("hex")}.jpg`;

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: compressed.data,
      ContentType: "image/jpeg",
      CacheControl: "public, max-age=31536000, immutable",
      ACL: "public-read",
    }),
  );

  return {
    url: `${publicUrl}/${objectKey}`,
    key: objectKey,
    width: compressed.info.width,
    height: compressed.info.height,
    bytes: compressed.info.size,
  };
}

export async function deletePhoto(objectKey: string): Promise<void> {
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: objectKey }));
}

export function photoUrl(objectKey: string): string {
  return `${publicUrl}/${objectKey}`;
}
