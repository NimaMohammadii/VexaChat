import { S3Client } from "@aws-sdk/client-s3";

function requireEnv(name: "R2_ACCOUNT_ID" | "R2_ACCESS_KEY_ID" | "R2_SECRET_ACCESS_KEY" | "R2_BUCKET_NAME" | "R2_ENDPOINT") {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getR2EnvPresence() {
  return {
    R2_ACCOUNT_ID: Boolean(process.env.R2_ACCOUNT_ID?.trim()),
    R2_ACCESS_KEY_ID: Boolean(process.env.R2_ACCESS_KEY_ID?.trim()),
    R2_SECRET_ACCESS_KEY: Boolean(process.env.R2_SECRET_ACCESS_KEY?.trim()),
    R2_BUCKET_NAME: Boolean(process.env.R2_BUCKET_NAME?.trim()),
    R2_ENDPOINT: Boolean(process.env.R2_ENDPOINT?.trim())
  };
}

function normalizeR2Endpoint(rawEndpoint: string, bucketName: string) {
  const endpoint = rawEndpoint.trim().replace(/\/+$/, "");

  if (!endpoint.startsWith("https://")) {
    throw new Error("R2_ENDPOINT must be a full https URL (example: https://<accountid>.r2.cloudflarestorage.com).");
  }

  let parsed: URL;
  try {
    parsed = new URL(endpoint);
  } catch {
    throw new Error("R2_ENDPOINT is invalid. Use the account endpoint only, without the bucket name.");
  }

  const host = parsed.hostname.toLowerCase();
  const pathParts = parsed.pathname.split("/").filter(Boolean).map((part) => part.toLowerCase());
  const normalizedBucket = bucketName.toLowerCase();
  const endpointIncludesBucket = host.startsWith(`${normalizedBucket}.`) || pathParts.includes(normalizedBucket);

  if (endpointIncludesBucket) {
    throw new Error("R2_ENDPOINT must be the account endpoint only (no bucket). Example: https://<accountid>.r2.cloudflarestorage.com");
  }

  return endpoint;
}

export function getR2Config() {
  const bucketName = requireEnv("R2_BUCKET_NAME");
  const endpoint = normalizeR2Endpoint(requireEnv("R2_ENDPOINT"), bucketName);

  return {
    accountId: requireEnv("R2_ACCOUNT_ID"),
    accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
    secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
    bucketName,
    endpoint
  };
}

let client: S3Client | null = null;

export function getR2Client() {
  if (client) return client;
  const config = getR2Config();
  client = new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey
    }
  });
  return client;
}
