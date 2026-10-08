import { GetObjectCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3"
import { deleteObject, headObject, presignGet, presignPut, putObject } from "../src/index"

const key = `smoke/${Date.now()}.txt`
const text = "hello docstore"

await putObject("recorder", key, Buffer.from(text), "text/plain")
console.log("head", (await headObject("recorder", key)).ContentLength)

const getUrl = await presignGet("recorder", key, { filename: "hello.txt", disposition: "attachment" })
const got = await fetch(getUrl)
console.log("presigned GET", got.status, await got.text(), got.headers.get("content-disposition"))

const putUrl = await presignPut("recorder", `${key}.put`, "text/plain")
const put = await fetch(putUrl, { method: "PUT", body: "via presigned put", headers: { "content-type": "text/plain" } })
console.log("presigned PUT", put.status, (await headObject("recorder", `${key}.put`)).ContentLength)

await deleteObject("recorder", key)
await deleteObject("recorder", `${key}.put`)

const recorder = new S3Client({
  endpoint: process.env.S3_ENDPOINT!,
  region: "us-east-1",
  forcePathStyle: true,
  credentials: { accessKeyId: "recorder-app", secretAccessKey: "recorder-app-secret" },
})
const attempts: [string, () => Promise<unknown>][] = [
  ["list docstore-recorder", () => recorder.send(new ListObjectsV2Command({ Bucket: "docstore-recorder" }))],
  ["list docstore-cjc", () => recorder.send(new ListObjectsV2Command({ Bucket: "docstore-cjc" }))],
  ["get docstore-cjc/x", () => recorder.send(new GetObjectCommand({ Bucket: "docstore-cjc", Key: "x" }))],
]
for (const [label, run] of attempts) {
  console.log(label, await run().then(() => "allowed", (e) => `denied (${e.name})`))
}
console.log("ok")
