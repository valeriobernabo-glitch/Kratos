import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import XLSX from "xlsx";
import { products } from "../schema/products";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const TENANT_ID = "default-tenant";

interface CCProduct {
  Customer: string;
  Id: number;
  Active: string;
  Name: string;
  Code: string;
  Tags: string;
  "Product Description": string;
  Type: string;
  "Volume (cubic Meters)": number;
  "Weight (Kilograms)": number;
  "Low Stock Threshold": number;
  Uuid: string;
  // Conversion Measurement (1) barcode is at a different column position
  [key: string]: unknown;
}

async function importProducts() {
  const filePath = path.resolve(
    __dirname,
    "../../../../Current Setup CC/Products.xlsx",
  );

  console.log(`Reading products from: ${filePath}`);
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]!]!;
  const rows = XLSX.utils.sheet_to_json<CCProduct>(sheet);

  console.log(`Found ${rows.length} rows`);

  const validRows = rows.filter((r) => r.Name && r.Code);
  console.log(`Valid products: ${validRows.length}`);

  const values = validRows.map((r) => ({
    tenantId: TENANT_ID,
    sku: r.Code,
    name: r.Name,
    description: r["Product Description"] || null,
    barcode: r.Code,
    unitOfMeasure: "unit",
    weightKg: r["Weight (Kilograms)"] ? Number(r["Weight (Kilograms)"]) : null,
    volumeM3: r["Volume (cubic Meters)"]
      ? Number(r["Volume (cubic Meters)"])
      : null,
    lowStockThreshold: r["Low Stock Threshold"]
      ? Number(r["Low Stock Threshold"])
      : 5,
    active: r.Active === "Yes",
    ccUuid: r.Uuid || null,
  }));

  const client = postgres(connectionString!);
  const db = drizzle(client);

  console.log(`Importing ${values.length} products...`);

  const batchSize = 100;
  let imported = 0;

  for (let i = 0; i < values.length; i += batchSize) {
    const batch = values.slice(i, i + batchSize);
    await db.insert(products).values(batch).onConflictDoNothing();
    imported += batch.length;
    console.log(`  ${imported}/${values.length}`);
  }

  console.log(`Import complete: ${imported} products`);
  process.exit(0);
}

importProducts().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
