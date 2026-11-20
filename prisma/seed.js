const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding Vertexia OS Core Data ---');

  // 1. Roles & Permissions
  const rolesData = [
    { name: 'Founder', code: 'FOUNDER', description: 'Full system access, business settings, financial overview, audit logs', isSystem: true },
    { name: 'Co-Founder', code: 'CO_FOUNDER', description: 'Executive management access with operational permissions', isSystem: true },
    { name: 'Developer', code: 'DEVELOPER', description: 'Internal product development, technical tasks, bugs', isSystem: true },
    { name: 'Designer', code: 'DESIGNER', description: 'UI/UX design, brand assets, product mockups', isSystem: true },
    { name: 'Sales', code: 'SALES', description: 'CRM, leads, deals, follow-ups, client discovery', isSystem: true },
    { name: 'Support', code: 'SUPPORT', description: 'Customer tickets, installations, license technical support', isSystem: true },
    { name: 'Finance', code: 'FINANCE', description: 'Invoices, payments, expenses, financial accounts', isSystem: true },
  ];

  const roles = {};
  for (const r of rolesData) {
    const role = await prisma.role.upsert({
      where: { code: r.code },
      update: { name: r.name, description: r.description },
      create: r,
    });
    roles[r.code] = role;
  }

  // Permissions list
  const modules = ['DASHBOARD', 'CRM', 'CLIENTS', 'PRODUCTS', 'INSTALLATIONS', 'FINANCE', 'PROJECTS', 'SUPPORT', 'TEAM', 'REPORTS', 'SETTINGS'];
  const actions = ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'EXPORT', 'APPROVE', 'MANAGE'];

  for (const mod of modules) {
    for (const act of actions) {
      const code = `${mod}:${act}`;
      const perm = await prisma.permission.upsert({
        where: { code },
        update: {},
        create: {
          module: mod,
          action: act,
          code,
          description: `Permission to ${act.toLowerCase()} ${mod.toLowerCase()}`,
        },
      });

      // Grant to FOUNDER
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: roles['FOUNDER'].id, permissionId: perm.id } },
        update: {},
        create: { roleId: roles['FOUNDER'].id, permissionId: perm.id },
      });
      // Grant most to CO_FOUNDER
      if (act !== 'DELETE') {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: roles['CO_FOUNDER'].id, permissionId: perm.id } },
          update: {},
          create: { roleId: roles['CO_FOUNDER'].id, permissionId: perm.id },
        });
      }
    }
  }

  // 2. Departments
  const depts = [
    { name: 'Leadership & Executive', code: 'EXEC', description: 'Executive leadership and company strategy' },
    { name: 'Engineering & Development', code: 'ENG', description: 'Software engineering, architecture, and maintenance' },
    { name: 'Design & Creative', code: 'DES', description: 'Product UI/UX design and brand creative' },
    { name: 'Sales & Growth', code: 'SALES', description: 'Client acquisition, outreach, and demos' },
    { name: 'Customer Success & Support', code: 'SUPP', description: 'Installation, training, and client troubleshooting' },
  ];

  const departments = {};
  for (const d of depts) {
    const dept = await prisma.department.upsert({
      where: { code: d.code },
      update: { name: d.name, description: d.description },
      create: d,
    });
    departments[d.code] = dept;
  }

  // 3. Current Team (Exact as specified: Taha Awan, Muhammad Ammar, Muzammil, plus Reserved position)
  const defaultPasswordHash = await bcrypt.hash('vertexia2026!', 10);

  // Founder: Taha Awan
  const empTaha = await prisma.employee.upsert({
    where: { email: 'taha@vertexia.pk' },
    update: { name: 'Taha Awan', jobTitle: 'Founder', status: 'ACTIVE' },
    create: {
      employeeCode: 'VTX-001',
      name: 'Taha Awan',
      email: 'taha@vertexia.pk',
      phone: '+92 300 1234567',
      jobTitle: 'Founder',
      departmentId: departments['EXEC'].id,
      status: 'ACTIVE',
      notes: 'Company Founder, Executive Direction & Product Architecture',
    },
  });

  await prisma.user.upsert({
    where: { email: 'taha@vertexia.pk' },
    update: { roleId: roles['FOUNDER'].id, employeeId: empTaha.id },
    create: {
      email: 'taha@vertexia.pk',
      name: 'Taha Awan',
      passwordHash: defaultPasswordHash,
      roleId: roles['FOUNDER'].id,
      employeeId: empTaha.id,
      isActive: true,
    },
  });

  // Co-Founder: Muhammad Ammar
  const empAmmar = await prisma.employee.upsert({
    where: { email: 'ammar@vertexia.pk' },
    update: { name: 'Muhammad Ammar', jobTitle: 'Co-founder', status: 'ACTIVE' },
    create: {
      employeeCode: 'VTX-002',
      name: 'Muhammad Ammar',
      email: 'ammar@vertexia.pk',
      phone: '+92 301 2345678',
      jobTitle: 'Co-founder',
      departmentId: departments['EXEC'].id,
      status: 'ACTIVE',
      notes: 'Co-founder, Operations & Business Development',
    },
  });

  await prisma.user.upsert({
    where: { email: 'ammar@vertexia.pk' },
    update: { roleId: roles['CO_FOUNDER'].id, employeeId: empAmmar.id },
    create: {
      email: 'ammar@vertexia.pk',
      name: 'Muhammad Ammar',
      passwordHash: defaultPasswordHash,
      roleId: roles['CO_FOUNDER'].id,
      employeeId: empAmmar.id,
      isActive: true,
    },
  });

  // Designer: Muzammil
  const empMuzammil = await prisma.employee.upsert({
    where: { email: 'muzammil@vertexia.pk' },
    update: { name: 'Muzammil', jobTitle: 'Designer', status: 'ACTIVE' },
    create: {
      employeeCode: 'VTX-003',
      name: 'Muzammil',
      email: 'muzammil@vertexia.pk',
      jobTitle: 'Designer',
      departmentId: departments['DES'].id,
      status: 'ACTIVE',
      notes: 'UI/UX Designer, Product Interfaces & Visual Identity',
    },
  });

  await prisma.user.upsert({
    where: { email: 'muzammil@vertexia.pk' },
    update: { roleId: roles['DESIGNER'].id, employeeId: empMuzammil.id },
    create: {
      email: 'muzammil@vertexia.pk',
      name: 'Muzammil',
      passwordHash: defaultPasswordHash,
      roleId: roles['DESIGNER'].id,
      employeeId: empMuzammil.id,
      isActive: true,
    },
  });

  // Reserved Slot: Coming Soon (NOT an active employee user account)
  await prisma.employee.upsert({
    where: { email: 'reserved.slot@vertexia.pk' },
    update: {},
    create: {
      employeeCode: 'VTX-RES-01',
      name: 'Coming Soon',
      email: 'reserved.slot@vertexia.pk',
      jobTitle: 'Future Engineering / Growth Position',
      departmentId: departments['ENG'].id,
      status: 'RESERVED',
      notes: 'Reserved future team position. Not an active employee account.',
    },
  });

  // 4. Products Portfolio
  // Product 1: Vertexia Pharmacy POS
  const catPOS = await prisma.productCategory.upsert({
    where: { name: 'Point of Sale' },
    update: {},
    create: { name: 'Point of Sale' },
  });

  const catCRM = await prisma.productCategory.upsert({
    where: { name: 'CRM & Operations' },
    update: {},
    create: { name: 'CRM & Operations' },
  });

  const pharmacyPOS = await prisma.product.upsert({
    where: { productCode: 'PRD-PHARMACY' },
    update: {},
    create: {
      productCode: 'PRD-PHARMACY',
      name: 'Vertexia Pharmacy POS',
      tagline: 'Comprehensive pharmacy management with mobile owner app & desktop POS',
      description: 'Established pharmacy point-of-sale system featuring fast medicine lookup, batch/expiry tracking, supplier billing, prescription management, and remote real-time owner monitoring mobile app.',
      categoryId: catPOS.id,
      status: 'ACTIVE',
      currentVersion: '2.4.0',
      releaseDate: new Date('2024-06-15'),
      features: {
        create: [
          { title: 'Owner Mobile App', description: 'Monitor daily sales, profit, cash flow, and low stock remotely on Android/iOS.', isHighlight: true },
          { title: 'Medicine Batch & Expiry Control', description: 'Automatic near-expiry alerts and FIFO batch inventory tracking.', isHighlight: true },
          { title: 'Barcode & Thermal Receipt Printing', description: 'Instant thermal printing with customizable receipt headers.', isHighlight: false },
          { title: 'Supplier & Purchase Orders', description: 'Manage medicine distributor invoices and credit balances.', isHighlight: false },
        ],
      },
      versions: {
        create: [
          { versionNumber: '2.4.0', releaseNotes: 'Added owner mobile API sync and enhanced batch discount handling.', status: 'STABLE' },
          { versionNumber: '2.3.2', releaseNotes: 'Speed optimization for 20,000+ medicine database queries.', status: 'STABLE' },
        ],
      },
      pricingPlans: {
        create: [
          { name: 'Lifetime License', licenseType: 'LIFETIME', price: 65000, currency: 'PKR', billingCycle: 'ONE_TIME', description: 'Perpetual desktop installation license with 1 year free support' },
          { name: 'Annual SaaS License', licenseType: 'YEARLY', price: 25000, currency: 'PKR', billingCycle: 'YEARLY', description: 'Yearly license including cloud mobile sync and continuous updates' },
        ],
      },
    },
  });

  // Product 2: Vertexia Garage CRM
  const garageCRM = await prisma.product.upsert({
    where: { productCode: 'PRD-GARAGE' },
    update: {},
    create: {
      productCode: 'PRD-GARAGE',
      name: 'Vertexia Garage CRM',
      tagline: 'Automotive workshop management, job cards & customer CRM',
      description: 'Specialized garage management system supporting vehicle registration, service history tracking, job cards, mechanics assignment, spare parts inventory, and billing.',
      categoryId: catCRM.id,
      status: 'ACTIVE',
      currentVersion: '1.8.0',
      releaseDate: new Date('2024-11-10'),
      features: {
        create: [
          { title: 'Vehicle History Tracking', description: 'Track mileage, previous repair history, and owner records by registration plate.', isHighlight: true },
          { title: 'Job Card & Work Order Engine', description: 'Assign tasks to mechanics with parts consumed and labor pricing.', isHighlight: true },
          { title: 'Spare Parts Inventory', description: 'Track auto parts stock, re-order levels, and profit margins.', isHighlight: false },
        ],
      },
      pricingPlans: {
        create: [
          { name: 'Lifetime License', licenseType: 'LIFETIME', price: 75000, currency: 'PKR', billingCycle: 'ONE_TIME', description: 'Complete workshop perpetual license' },
          { name: 'Monthly Plan', licenseType: 'MONTHLY', price: 5000, currency: 'PKR', billingCycle: 'MONTHLY', description: 'Flexible month-to-month subscription' },
        ],
      },
    },
  });

  // Product 3: Vertexia Restaurant POS
  await prisma.product.upsert({
    where: { productCode: 'PRD-RESTAURANT' },
    update: {},
    create: {
      productCode: 'PRD-RESTAURANT',
      name: 'Vertexia Restaurant POS',
      tagline: 'Dine-in, takeaway, KDS & kitchen printing software',
      description: 'Restaurant management and point-of-sale product direction including table management, kitchen order tickets (KOT), recipe inventory, and split bills.',
      categoryId: catPOS.id,
      status: 'IN_DEVELOPMENT',
      currentVersion: '0.9.0-beta',
      features: {
        create: [
          { title: 'Table & Floor Plan', description: 'Visual dining table management and reservation system.', isHighlight: true },
          { title: 'Kitchen Display (KDS)', description: 'Real-time kitchen order screen and multi-station routing.', isHighlight: true },
        ],
      },
      pricingPlans: {
        create: [
          { name: 'Standard Restaurant Plan', licenseType: 'YEARLY', price: 35000, currency: 'PKR', billingCycle: 'YEARLY', description: 'Early access pricing for beta food outlets' },
        ],
      },
    },
  });

  // Product 4: Vertexia Mini Mart POS
  await prisma.product.upsert({
    where: { productCode: 'PRD-MINIMART' },
    update: {},
    create: {
      productCode: 'PRD-MINIMART',
      name: 'Vertexia Mini Mart POS',
      tagline: 'High-speed barcode scanning & inventory for retail and mini marts',
      description: 'Retail management and POS for mini marts, supermarkets, grocery stores, and general retail stores. Rapid checkout, weighing scale integration, and wholesale rates. Product development in progress.',
      categoryId: catPOS.id,
      status: 'IN_DEVELOPMENT',
      currentVersion: '0.5.0-alpha',
      features: {
        create: [
          { title: 'Fast Barcode Checkout', description: 'Sub-second barcode lookups and dual customer display support.', isHighlight: true },
          { title: 'Wholesale & Retail Multi-Pricing', description: 'Automatic price tiered pricing based on purchase quantity.', isHighlight: true },
        ],
      },
      pricingPlans: {
        create: [
          { name: 'Retail Starter', licenseType: 'LIFETIME', price: 55000, currency: 'PKR', billingCycle: 'ONE_TIME', description: 'Single till perpetual retail license' },
        ],
      },
    },
  });

  // 5. Lead Sources
  const sources = [
    'Google Maps',
    'Instagram',
    'Facebook',
    'Referral',
    'Website Inquiries',
    'Direct Calls',
    'Cold Outreach',
  ];

  for (const s of sources) {
    await prisma.leadSource.upsert({
      where: { name: s },
      update: {},
      create: { name: s },
    });
  }

  // 6. Expense Categories
  const expCats = [
    'Hosting & Infrastructure',
    'Domain Names',
    'Software Subscriptions',
    'Marketing & Advertising',
    'Salaries & Stipends',
    'Hardware & Equipment',
    'Office & Utilities',
    'Legal & Professional',
    'Other Expenses',
  ];

  for (const c of expCats) {
    await prisma.expenseCategory.upsert({
      where: { name: c },
      update: {},
      create: { name: c },
    });
  }

  // 7. Company Settings
  await prisma.companySetting.upsert({
    where: { id: 'default-settings' },
    update: {},
    create: {
      id: 'default-settings',
      companyName: 'Vertexia',
      tagline: 'One Platform. Complete Business Control.',
      website: 'https://vertexia.pk',
      email: 'contact@vertexia.pk',
      phone: '+92 300 0000000',
      address: 'Karachi, Sindh, Pakistan',
      city: 'Karachi',
      country: 'Pakistan',
      currency: 'PKR',
      timezone: 'Asia/Karachi',
      dateFormat: 'DD/MM/YYYY',
      invoicePrefix: 'VTX-INV',
      primaryColor: '#0F172A',
      accentColor: '#2563EB',
    },
  });

  // 8. Knowledge Base Core Articles
  await prisma.knowledgeArticle.upsert({
    where: { slug: 'vertexia-company-handbook' },
    update: {},
    create: {
      title: 'Vertexia Company Handbook & Core Values',
      slug: 'vertexia-company-handbook',
      category: 'COMPANY',
      author: 'Taha Awan',
      tags: 'handbook, principles, operations',
      content: `### Welcome to Vertexia\n\nVertexia operates in Karachi, Pakistan as a specialized software product house focused on enterprise point-of-sale (POS) and business operating solutions. Our goal is to empower local businesses with stable, modern software that streamlines daily inventory, billing, and owner oversight.`,
    },
  });

  await prisma.knowledgeArticle.upsert({
    where: { slug: 'pharmacy-pos-deployment-sop' },
    update: {},
    create: {
      title: 'Pharmacy POS Deployment Standard Operating Procedure',
      slug: 'pharmacy-pos-deployment-sop',
      category: 'TECHNICAL',
      author: 'Muhammad Ammar',
      tags: 'pharmacy, installation, SOP',
      content: `### Deployment Checklist:\n1. Verify hardware: Windows 10/11 64-bit, min 8GB RAM, SSD.\n2. Thermal receipt printer drivers (80mm / 58mm).\n3. Barcode scanner test in keyboard emulation mode.\n4. Database engine setup & initial medicine formulary import.\n5. Mobile owner app API key registration and test sync.\n6. Issue official license certificate.`,
    },
  });

  // 9. Initial Projects
  await prisma.project.upsert({
    where: { projectCode: 'PRJ-PHARM-MOB' },
    update: {},
    create: {
      projectCode: 'PRJ-PHARM-MOB',
      name: 'Pharmacy POS Owner Mobile App v2',
      type: 'INTERNAL',
      productId: pharmacyPOS.id,
      managerName: 'Taha Awan',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      progress: 65,
      description: 'Enhance real-time cloud sync, instant daily profit push notifications, and multi-branch pharmacy overview.',
    },
  });

  await prisma.project.upsert({
    where: { projectCode: 'PRJ-MINIMART-DEV' },
    update: {},
    create: {
      projectCode: 'PRJ-MINIMART-DEV',
      name: 'Mini Mart POS Core Engine',
      type: 'INTERNAL',
      productId: null,
      managerName: 'Taha Awan',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      progress: 35,
      description: 'Build fast barcode caching, weighing scale serial communication, and wholesale pricing engine.',
    },
  });

  console.log('--- Vertexia OS Seed Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
