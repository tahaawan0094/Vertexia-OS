/**
 * VERTEXIA OS — MIGRATION TOOL: SQLite -> MongoDB Atlas
 *
 * This script exports all current production records from the local SQLite database
 * and seamlessly seeds them into your cloud MongoDB Atlas database.
 */

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { PrismaClient } = require("@prisma/client");

// Read .env file directly if needed
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

let mongoUri = process.argv[2] || process.env.MONGODB_URI || process.env.DATABASE_URL;

if (!mongoUri || !mongoUri.startsWith("mongodb")) {
  console.error("\n❌ Error: Please provide a valid MongoDB Atlas connection URI.");
  console.log("Usage: node scripts/migrate-sqlite-to-mongodb.js <MONGODB_URI>");
  process.exit(1);
}

// Ensure database name is set
if (mongoUri.endsWith(".mongodb.net/")) {
  mongoUri += "vertexia_os?retryWrites=true&w=majority";
} else if (mongoUri.endsWith(".mongodb.net")) {
  mongoUri += "/vertexia_os?retryWrites=true&w=majority";
}

async function runMigration() {
  console.log("=====================================================");
  console.log("   VERTEXIA OS — DATABASE MIGRATION TO MONGODB ATLAS   ");
  console.log("=====================================================\n");

  // Explicitly connect to local SQLite dev.db for reading source data
  const sqlitePrisma = new PrismaClient({
    datasources: {
      db: {
        url: "file:./dev.db",
      },
    },
  });

  try {
    console.log("1. Reading existing verified data from local database...");
    const [
      roles,
      permissions,
      rolePermissions,
      departments,
      employees,
      users,
      productCategories,
      products,
      productFeatures,
      pricingPlans,
      clients,
      branches,
      installations,
      licenses,
      invoices,
      invoiceItems,
      expenseCategories,
      expenses,
      projects,
      tasks,
      tickets,
      knowledgeArticles,
    ] = await Promise.all([
      sqlitePrisma.role.findMany(),
      sqlitePrisma.permission.findMany(),
      sqlitePrisma.rolePermission.findMany(),
      sqlitePrisma.department.findMany(),
      sqlitePrisma.employee.findMany(),
      sqlitePrisma.user.findMany(),
      sqlitePrisma.productCategory.findMany(),
      sqlitePrisma.product.findMany(),
      sqlitePrisma.productFeature.findMany(),
      sqlitePrisma.pricingPlan.findMany(),
      sqlitePrisma.client.findMany(),
      sqlitePrisma.branch.findMany(),
      sqlitePrisma.installation.findMany(),
      sqlitePrisma.license.findMany(),
      sqlitePrisma.invoice.findMany(),
      sqlitePrisma.invoiceItem.findMany(),
      sqlitePrisma.expenseCategory.findMany(),
      sqlitePrisma.expense.findMany(),
      sqlitePrisma.project.findMany(),
      sqlitePrisma.task.findMany(),
      sqlitePrisma.ticket.findMany(),
      sqlitePrisma.knowledgeArticle.findMany(),
    ]);

    console.log(`   Found: ${users.length} Users, ${products.length} Products, ${clients.length} Clients, ${invoices.length} Invoices.`);

    console.log("\n2. Connecting to MongoDB Atlas cluster...");
    // Mask credentials when printing to console
    const maskedUri = mongoUri.replace(/(mongodb\+srv:\/\/[^:]+:)[^@]+(@.+)/, "$1******$2");
    console.log(`   Cluster target: ${maskedUri}`);

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log("   ✓ Successfully connected to MongoDB Atlas!");

    const db = mongoose.connection.db;

    console.log("\n3. Migrating collections to MongoDB Atlas...");

    async function syncCollection(name, data) {
      if (!data || data.length === 0) return;
      const col = db.collection(name);
      await col.deleteMany({});
      const docs = data.map((d) => {
        const doc = { ...d };
        doc._id = d.id; // Preserve ID mapping
        return doc;
      });
      await col.insertMany(docs);
      console.log(`   ✓ Imported ${docs.length} documents into "${name}"`);
    }

    await syncCollection("roles", roles);
    await syncCollection("permissions", permissions);
    await syncCollection("role_permissions", rolePermissions);
    await syncCollection("departments", departments);
    await syncCollection("employees", employees);
    await syncCollection("users", users);
    await syncCollection("product_categories", productCategories);
    await syncCollection("products", products);
    await syncCollection("product_features", productFeatures);
    await syncCollection("pricing_plans", pricingPlans);
    await syncCollection("clients", clients);
    await syncCollection("branches", branches);
    await syncCollection("installations", installations);
    await syncCollection("licenses", licenses);
    await syncCollection("invoices", invoices);
    await syncCollection("invoice_items", invoiceItems);
    await syncCollection("expense_categories", expenseCategories);
    await syncCollection("expenses", expenses);
    await syncCollection("projects", projects);
    await syncCollection("tasks", tasks);
    await syncCollection("tickets", tickets);
    await syncCollection("knowledge_articles", knowledgeArticles);

    console.log("\n=====================================================");
    console.log("   🎉 MIGRATION COMPLETED SUCCESSFULLY!             ");
    console.log("   All Vertexia OS records are now in MongoDB Atlas.");
    console.log("=====================================================\n");
  } catch (err) {
    console.error("\n❌ Migration failed:", err.message);
  } finally {
    await sqlitePrisma.$disconnect();
    await mongoose.disconnect();
  }
}

runMigration();
