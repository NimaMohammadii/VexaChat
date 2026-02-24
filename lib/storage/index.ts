import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getR2Client, getR2Config } from "@/lib/r2/client";
import { getSignedReadUrl } from "@/lib/storage/object-storage";

type UploadChatMediaInput = {
  file?: File;
  fileBuffer?: Buffer;
  key: string;
  contentType: string;
};

export async function uploadChatMedia({ file, fileBuffer, key, contentType }: UploadChatMediaInput) {
  const payload = fileBuffer ?? (file ? Buffer.from(await file.arrayBuffer()) : null);

  if (!payload) {
    throw new Error("No media payload provided for upload");
  }

  const { bucketName } = getR2Config();
  await getR2Client().send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: payload,
      ContentType: contentType
    })
  );

  return {
    key,
    publicUrl: await getPublicUrl({ key })
  };
}

export async function deleteChatMedia({ key }: { key: string }) {
  const { bucketName } = getR2Config();
  await getR2Client().send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
}

export async function getPublicUrl({ key }: { key: string }) {
  return getSignedReadUrl(key, 60 * 60);
}
