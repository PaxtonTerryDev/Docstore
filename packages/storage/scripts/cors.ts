import { PutBucketCorsCommand, S3Client } from "@aws-sdk/client-s3"

const client = new S3Client({
  endpoint: process.env.S3_ENDPOINT!,
  region: process.env.S3_REGION ?? "us-east-1",
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
})

await client.send(
  new PutBucketCorsCommand({
    Bucket: process.env.S3_BUCKET ?? "docstore",
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedOrigins: ["*"],
          AllowedMethods: ["GET", "PUT", "HEAD"],
          AllowedHeaders: ["*"],
          ExposeHeaders: ["ETag", "Content-Disposition"],
          MaxAgeSeconds: 3000,
        },
      ],
    },
  })
)
console.log("cors set")
