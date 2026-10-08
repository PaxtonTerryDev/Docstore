import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

export * from "./schema"
export { hashPassword, verifyPassword } from "./password"

export const sql = postgres(process.env.DATABASE_URL!)
export const db = drizzle(sql, { schema })
export { eq, and, ilike, inArray, desc, sql as sqlTag } from "drizzle-orm"
