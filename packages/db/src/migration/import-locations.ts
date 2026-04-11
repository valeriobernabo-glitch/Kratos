import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import XLSX from "xlsx";
import { locations } from "../schema/locations";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const TENANT_ID = "default-tenant";

interface CCLocation {
  id: number;
  name: string;
  barcode: string;
  zone_name: string;
  capacity: string;
  row: string;
  bay: string;
  level: string;
  depth: string;
  product_type: string;
  efficiency: string;
  max_pallets: string;
  active: string;
  charge_group: string;
}

async function importLocations() {
  const filePath = path.resolve(
    __dirname,
    "../../../../Current Setup CC/WarehouseLocations-2026-04-06.xls",
  );

  console.log(`Reading locations from: ${filePath}`);
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]!]!;
  const rows = XLSX.utils.sheet_to_json<CCLocation>(sheet);

  console.log(`Found ${rows.length} rows`);

  const validRows = rows.filter((r) => r.name && r.barcode);
  console.log(`Valid locations: ${validRows.length}`);

  const values = validRows.map((r) => {
    const isRack = r.row && r.bay;
    return {
      tenantId: TENANT_ID,
      name: r.name,
      barcode: r.barcode,
      row: r.row || null,
      bay: r.bay ? Number(r.bay) : null,
      level: r.level ? Number(r.level) : null,
      bin: extractBin(r.name),
      capacity: r.capacity === "Multiple Pallets"
        ? ("multiple_pallets" as const)
        : ("single_pallet" as const),
      efficiency: r.efficiency ? Number(r.efficiency) : 5,
      locationType: isRack
        ? ("rack" as const)
        : r.name === "FLOOR"
          ? ("floor" as const)
          : r.name === "OFFICE"
            ? ("office" as const)
            : ("rack" as const),
      active: r.active === "Yes",
    };
  });

  const client = postgres(connectionString!);
  const db = drizzle(client);

  console.log(`Importing ${values.length} locations...`);

  const batchSize = 100;
  let imported = 0;

  for (let i = 0; i < values.length; i += batchSize) {
    const batch = values.slice(i, i + batchSize);
    await db.insert(locations).values(batch).onConflictDoNothing();
    imported += batch.length;
    console.log(`  ${imported}/${values.length}`);
  }

  console.log(`Import complete: ${imported} locations`);
  process.exit(0);
}

function extractBin(name: string): number | null {
  const match = name.match(/B(\d+)$/);
  return match ? Number(match[1]) : null;
}

importLocations().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
