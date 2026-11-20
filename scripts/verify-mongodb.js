const fs = require("fs");
const mongoose = require("mongoose");

async function verifyMongo() {
  const envContent = fs.readFileSync(".env", "utf8");
  const match = envContent.match(/MONGODB_URI="([^"]+)"/);
  const uri = match[1];

  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const users = await db.collection("users").find().toArray();
  const products = await db.collection("products").find().toArray();
  const clients = await db.collection("clients").find().toArray();
  const invoices = await db.collection("invoices").find().toArray();

  console.log("=========================================");
  console.log("  LIVE MONGODB ATLAS VERIFICATION REPORT ");
  console.log("=========================================");
  console.log(`✓ Connected to Database: "${db.databaseName}"`);
  console.log(`✓ Total Users: ${users.length} (${users.map((u) => u.email).join(", ")})`);
  console.log(`✓ Total Products: ${products.length} (${products.map((p) => p.name).join(", ")})`);
  console.log(`✓ Total Clients: ${clients.length} (${clients.map((c) => c.businessName).join(", ")})`);
  console.log(`✓ Total Invoices: ${invoices.length}`);
  console.log("=========================================");

  await mongoose.disconnect();
}

verifyMongo().catch((err) => {
  console.error("Verification error:", err);
  process.exit(1);
});
