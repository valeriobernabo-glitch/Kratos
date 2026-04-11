import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { tenants } from "./schema/tenants";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const client = postgres(connectionString);
const db = drizzle(client);

async function seed() {
  console.log("Seeding default tenant...");

  await db
    .insert(tenants)
    .values({
      id: "default-tenant",
      name: "Trade Hero Australia",
      slug: "trade-hero-au",
    })
    .onConflictDoNothing();

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
