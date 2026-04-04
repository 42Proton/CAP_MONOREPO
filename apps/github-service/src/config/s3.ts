import { S3Client , CreateBucketCommand, HeadBucketCommand} from "@aws-sdk/client-s3";
import { env } from './env';

export const s3Client = new S3Client({
  endpoint: env.MINIO_ENDPOINT,
  region: "us-east-1", 
  credentials: {
    accessKeyId: env.MINIO_ACCESS_KEY,
    secretAccessKey: env.MINIO_SECRET_KEY,
  },
  forcePathStyle: true,
});

export const BUCKET_NAME = "cap-project";

export const ensureBucketExists = async () => {
  try {
  await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
  console.log(`[MinIO]: Bucket ${BUCKET_NAME} already exists.`);
} 
catch (error: any) {
  if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
    console.log(`[MinIO]: Bucket ${BUCKET_NAME} not found. Creating it...`);
    await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }));
  } 
  else {
    throw error;
  }
}
};