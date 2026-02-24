import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import { getR2Client, getR2Config, getR2EnvPresence } from "@/lib/r2/client";

function endpointLooksValid(endpoint: string) {
  try {
    const parsed = new URL(endpoint);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const providedSecret = request.headers.get("x-cron-secret") ?? "";
  const expectedSecret = process.env.CRON_SECRET?.trim() ?? "";

  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { bucketName, endpoint } = getR2Config();
    const testKey = `healthchecks/${Date.now()}-${crypto.randomUUID()}.txt`;

    await Promise.all([
      getSignedUrl(getR2Client(), new PutObjectCommand({ Bucket: bucketName, Key: testKey, ContentType: "text/plain" }), { expiresIn: 60 }),
      getSignedUrl(getR2Client(), new GetObjectCommand({ Bucket: bucketName, Key: testKey }), { expiresIn: 60 })
    ]);

    return NextResponse.json({
      ok: true,
      checks: {
        bucketConfigured: Boolean(bucketName),
        endpointFormatValid: endpointLooksValid(endpoint)
      }
    });
  } catch (error) {
    console.error("[storage/health] R2 health check failed", {
      error,
      envPresence: getR2EnvPresence()
    });

    return NextResponse.json({
      ok: false,
      error: "R2 health check failed.",
      checks: {
        bucketConfigured: Boolean(process.env.R2_BUCKET_NAME?.trim()),
        endpointFormatValid: Boolean(process.env.R2_ENDPOINT?.trim())
      }
    }, { status: 500 });
  }
}
