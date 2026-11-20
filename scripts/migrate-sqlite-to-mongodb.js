/**
 * VERTEXIA OS — MIGRATION TOOL: SQLite -> MongoDB Atlas
 *
 * This script exports all current production records from the local SQLite database
 * and seamlessly seeds them into your cloud MongoDB Atlas database.
 *
 * Usage:
 *   node scripts/migrate-sqlite-to-mongodb.js <MONGODB_URI>
 * Example:
 *   node scripts/migrate-sqlite-to-mongodb.js "mongodb+srv://admin:pass@cluster0.abcde.mongodb.net/vertexia_os?retryWrites=true&w=majority"
 */

const { PrismaClient } = require("@prisma/client");
const mongoose = require("mongoose");

const mongoUri = process.argv[2] || process.env.MONGODB_URI || process.env.DATABASE_URL;

if (!mongoUri || !mongoUri.startsWith("mongodb")) {
  console.error("\n❌ Error: Please provide a valid MongoDB Atlas connection URI.");
  console.log("Usage: node scripts/migrate-sqlite-to-mongodb.js <MONGODB_URI>");
  console.log('Example: node scripts/migrate-sqlite-to-mongodb.js "mongodb+srv://admin:pass@cluster.mongodb.net/vertexia_os"\n');
  process.exit(1);
}

async function runMigration() {
  console.log("=====================================================");
  console.log("   VERTEXIA OS — DATABASE MIGRATION TO MONGODB ATLAS   ");
  console.log("=====================================================\n");

  const sqlitePrisma = new PrismaClient();

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
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
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
        doc._id = d.id; // Map primary key
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
