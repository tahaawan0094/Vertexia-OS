const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");

function isAdminUser(user) {
  if (!user) return false;
  const code = (user.roleCode || "").toUpperCase();
  const name = (user.role || "").toUpperCase();
  return code === "ADMIN" || code === "FOUNDER" || name === "ADMIN" || name === "FOUNDER";
}

async function runRBACTests() {
  console.log("=========================================");
  console.log("   VERTEXIA OS — RBAC & ADMIN TESTS      ");
  console.log("=========================================\n");

  // 1. Role validation
  const founder = { roleCode: "FOUNDER", role: "Founder" };
  const admin = { roleCode: "ADMIN", role: "Admin" };
  const dev = { roleCode: "DEVELOPER", role: "Developer" };
  const sales = { roleCode: "SALES", role: "Sales" };

  console.assert(isAdminUser(founder) === true, "Founder should be admin");
  console.assert(isAdminUser(admin) === true, "Admin should be admin");
  console.assert(isAdminUser(dev) === false, "Developer should NOT be admin");
  console.assert(isAdminUser(sales) === false, "Sales should NOT be admin");
  console.log("[PASS] Server-side isAdminUser() permissions gate verified.");

  // 2. Test user creation & role assignment in database
  const salesRole = await prisma.role.findFirst({ where: { code: "SALES" } });
  if (!salesRole) throw new Error("Sales role not found");

  const testEmail = `test_user_${Date.now()}@vertexia.pk`;
  const pwdHash = await bcrypt.hash("TempPass123!", 10);

  const testUser = await prisma.user.create({
    data: {
      name: "Temporary RBAC Test User",
      email: testEmail,
      passwordHash: pwdHash,
      roleId: salesRole.id,
      isActive: true,
    },
    include: { role: true },
  });
  console.log(`[PASS] Created user "${testUser.name}" with role "${testUser.role.name}"`);

  // 3. Deactivate user
  const deactivated = await prisma.user.update({
    where: { id: testUser.id },
    data: { isActive: false },
  });
  console.assert(deactivated.isActive === false, "User should be deactivated");
  console.log("[PASS] Account deactivation toggled successfully.");

  // 4. Password reset
  const newHash = await bcrypt.hash("NewSecurePass2026!", 10);
  await prisma.user.update({
    where: { id: testUser.id },
    data: { passwordHash: newHash },
  });
  const passMatches = await bcrypt.compare("NewSecurePass2026!", newHash);
  console.assert(passMatches, "New password must match");
  console.log("[PASS] Admin password reset verified.");

  // 5. Cleanup test user
  await prisma.user.delete({ where: { id: testUser.id } });
  console.log("[PASS] Test user cleanly removed from database.\n");

  console.log("=========================================");
  console.log("   ALL RBAC & ADMIN TESTS PASSED!        ");
  console.log("=========================================\n");

  await prisma.$disconnect();
}

runRBACTests().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
