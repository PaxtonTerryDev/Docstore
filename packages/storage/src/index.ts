import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const bucketFor = (dept: string) => `docstore-${dept}`

function createClient(endpoint: string, dept: string) {
  return new S3Client({
    endpoint,
    region: process.env.S3_REGION ?? "us-east-1",
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== "false",
    credentials: {
      accessKeyId: `${dept}-app`,
      secretAccessKey: `${dept}-app-secret`,
    },
  })
}

const clients = new Map<string, S3Client>()
function client(dept: string, external = false) {
  const endpoint = external
    ? (process.env.S3_PUBLIC_ENDPOINT ?? process.env.S3_ENDPOINT!)
    : process.env.S3_ENDPOINT!
  const k = `${dept}:${external}`
  if (!clients.has(k)) clients.set(k, createClient(endpoint, dept))
  return clients.get(k)!
}

export const putObject = (dept: string, key: string, body: Uint8Array, contentType?: string) =>
  client(dept).send(
    new PutObjectCommand({
      Bucket: bucketFor(dept),
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  )

export const headObject = (dept: string, key: string) =>
  client(dept).send(new HeadObjectCommand({ Bucket: bucketFor(dept), Key: key }))

export const deleteObject = (dept: string, key: string) =>
  client(dept).send(new DeleteObjectCommand({ Bucket: bucketFor(dept), Key: key }))

export const presignPut = (dept: string, key: string, contentType?: string, expiresIn = 300) =>
  getSignedUrl(
    client(dept, true),
    new PutObjectCommand({ Bucket: bucketFor(dept), Key: key, ContentType: contentType }),
    { expiresIn }
  )

export const presignGet = (
  dept: string,
  key: string,
  opts: { filename?: string; disposition?: "inline" | "attachment" } = {},
  expiresIn = 60
) =>
  getSignedUrl(
    client(dept, true),
    new GetObjectCommand({
      Bucket: bucketFor(dept),
      Key: key,
      ResponseContentDisposition: opts.filename
        ? `${opts.disposition ?? "inline"}; filename="${opts.filename}"`
        : undefined,
    }),
    { expiresIn }
  )
