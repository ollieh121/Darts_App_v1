import { neon } from "@neondatabase/serverless";

// Neon on Vercel injects DATABASE_URL; POSTGRES_URL is used in some setups
const connectionString =
  process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? "";

const sql = neon(connectionString);

export { sql };
