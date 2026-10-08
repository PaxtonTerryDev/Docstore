import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const bucket = process.env.S3_BUCKET ?? "docstore"

function createClient(endpoint: string) {
  return new S3Client({
    endpoint,
    region: process.env.S3_REGION ?? "us-east-1",
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== "false",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY!,
      secretAccessKey: process.env.S3_SECRET_KEY!,
    },
  })
}

const internal = createClient(process.env.S3_ENDPOINT!)
const external = createClient(
  process.env.S3_PUBLIC_ENDPOINT ?? process.env.S3_ENDPOINT!
)

export const putObject = (key: string, body: Uint8Array, contentType?: string) =>
  internal.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  )

export const headObject = (key: string) =>
  internal.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))

export const deleteObject = (key: string) =>
  internal.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))

export const presignPut = (key: string, contentType?: string, expiresIn = 300) =>
  getSignedUrl(
    external,
    new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }),
    { expiresIn }
  )

export const presignGet = (
  key: string,
  opts: { filename?: string; disposition?: "inline" | "attachment" } = {},
  expiresIn = 60
) =>
  getSignedUrl(
    external,
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ResponseContentDisposition: opts.filename
        ? `${opts.disposition ?? "inline"}; filename="${opts.filename}"`
        : undefined,
    }),
    { expiresIn }
  )
