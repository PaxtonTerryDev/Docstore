import { deleteObject, headObject, presignGet, presignPut, putObject } from "../src/index"

const key = `smoke/${Date.now()}.txt`
const text = "hello docstore"

await putObject(key, Buffer.from(text), "text/plain")
console.log("head", (await headObject(key)).ContentLength)

const getUrl = await presignGet(key, { filename: "hello.txt", disposition: "attachment" })
const got = await fetch(getUrl)
console.log("presigned GET", got.status, await got.text(), got.headers.get("content-disposition"))

const putUrl = await presignPut(`${key}.put`, "text/plain")
const put = await fetch(putUrl, { method: "PUT", body: "via presigned put", headers: { "content-type": "text/plain" } })
console.log("presigned PUT", put.status, (await headObject(`${key}.put`)).ContentLength)

await deleteObject(key)
await deleteObject(`${key}.put`)
console.log("ok")
