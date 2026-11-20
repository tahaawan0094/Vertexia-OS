const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runTests() {
  console.log('====================================================');
  console.log('   VERTEXIA OS — CRITICAL BUSINESS WORKFLOW TESTS   ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Verify Core Seed Data
    console.log('--- Step 1: Checking Initial Core Records ---');
    const products = await prisma.product.findMany();
    assert(products.length >= 4, `Found ${products.length} products (Expected >= 4)`);

    const pharmacyProduct = products.find((p) => p.productCode === 'PRD-PHARMACY');
    assert(pharmacyProduct && pharmacyProduct.name === 'Vertexia Pharmacy POS', 'Vertexia Pharmacy POS is active');

    const employees = await prisma.employee.findMany();
    const taha = employees.find((e) => e.name === 'Taha Awan');
    const ammar = employees.find((e) => e.name === 'Muhammad Ammar');
    const muzammil = employees.find((e) => e.name === 'Muzammil');
    const reservedSlot = employees.find((e) => e.name === 'Coming Soon');

    assert(taha && taha.jobTitle === 'Founder', 'Taha Awan recorded as Founder');
    assert(ammar && ammar.jobTitle === 'Co-founder', 'Muhammad Ammar recorded as Co-founder');
    assert(muzammil && muzammil.jobTitle === 'Designer', 'Muzammil recorded as Designer');
    assert(reservedSlot && reservedSlot.status === 'RESERVED', 'Reserved team slot preserved (not an employee account)');

    // 2. Workflow A: Lead Creation, Duplicate Detection & Conversion to Client
    console.log('\n--- Step 2: Testing Workflow A (Lead to Customer Conversion) ---');
    const testLeadCode = `TEST-LD-${Date.now().toString().slice(-4)}`;
    const testLeadName = `Test Karachi Chemist ${Date.now().toString().slice(-4)}`;

    const newLead = await prisma.lead.create({
      data: {
        leadCode: testLeadCode,
        businessName: testLeadName,
        contactPerson: 'Dr. Tariq Khan',
        phone: '+92 300 9876543',
        city: 'Karachi',
        businessCategory: 'Pharmacy',
        interestedProduct: 'Vertexia Pharmacy POS',
        status: 'INTERESTED',
        estimatedValue: 65000,
      },
    });
    assert(newLead.id && newLead.status === 'INTERESTED', 'Created test prospective lead');

    // Duplicate check test
    const duplicateMatch = await prisma.lead.findFirst({
      where: { businessName: testLeadName },
    });
    assert(duplicateMatch.id === newLead.id, 'Duplicate query accurately detects prospective lead');

    // Convert to client
    const clientCount = await prisma.client.count();
    const newClientCode = `CLI-TEST-${clientCount + 1}`;

    const client = await prisma.client.create({
      data: {
        clientCode: newClientCode,
        businessName: newLead.businessName,
        contactPerson: newLead.contactPerson,
        phone: newLead.phone,
        city: newLead.city,
        status: 'ACTIVE',
        branches: {
          create: {
            name: 'Clifton Main Branch',
            code: 'BR-01',
            city: 'Karachi',
          },
        },
      },
      include: { branches: true },
    });

    await prisma.lead.update({
      where: { id: newLead.id },
      data: {
        convertedClientId: client.id,
        status: 'WON',
      },
    });

    assert(client.id && client.branches.length === 1, 'Client created with initial branch');
    const updatedLead = await prisma.lead.findUnique({ where: { id: newLead.id } });
    assert(updatedLead.status === 'WON' && updatedLead.convertedClientId === client.id, 'Lead marked WON and linked to Client');

    // 3. Workflow B: Installation Deployment & License Generation
    console.log('\n--- Step 3: Testing Workflow B (Installation & Licensing) ---');
    const installCode = `INS-TEST-${Date.now().toString().slice(-4)}`;
    const licenseKey = `VTX-TEST-${Date.now().toString().slice(-6)}`;

    const installation = await prisma.installation.create({
      data: {
        installCode,
        clientId: client.id,
        branchId: client.branches[0].id,
        productId: pharmacyProduct.id,
        softwareVersion: pharmacyProduct.currentVersion,
        status: 'ACTIVE',
        license: {
          create: {
            licenseKey,
            type: 'YEARLY',
            status: 'ACTIVE',
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            history: {
              create: {
                action: 'ISSUED',
                notes: 'Yearly license issued upon onboarding.',
              },
            },
          },
        },
      },
      include: { license: true },
    });

    assert(installation.id && installation.license.licenseKey === licenseKey, 'Installation deployed and License Key generated');
    assert(installation.license.type === 'YEARLY', 'License model set to YEARLY');

    // 4. Workflow C: Invoicing & Payment Allocation
    console.log('\n--- Step 4: Testing Workflow C (Invoicing & Payment Allocation) ---');
    const invoiceNumber = `INV-TEST-${Date.now().toString().slice(-4)}`;
    const lineItemAmount = 65000;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        clientId: client.id,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        subtotal: lineItemAmount,
        discount: 5000,
        tax: 0,
        totalAmount: 60000,
        paidAmount: 0,
        status: 'SENT',
        items: {
          create: [
            {
              description: 'Vertexia Pharmacy POS License + Mobile App Setup',
              quantity: 1,
              unitPrice: 65000,
              amount: 65000,
            },
          ],
        },
      },
    });

    assert(invoice.id && invoice.totalAmount === 60000, 'Invoice created with validated total of 60,000 PKR');

    // Partial Payment Recording
    const partialAmount = 30000;
    const payment = await prisma.payment.create({
      data: {
        paymentCode: `PAY-TEST-${Date.now().toString().slice(-4)}`,
        clientId: client.id,
        amount: partialAmount,
        paymentMethod: 'BANK_TRANSFER',
        referenceNo: 'Meezan-TX-998877',
        receivedBy: 'Taha Awan',
        status: 'COMPLETED',
        allocations: {
          create: {
            invoiceId: invoice.id,
            amount: partialAmount,
          },
        },
      },
    });

    // Update invoice status
    const updatedInvoice1 = await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        paidAmount: invoice.paidAmount + partialAmount,
        status: 'PARTIALLY_PAID',
      },
    });

    assert(payment.id && updatedInvoice1.paidAmount === 30000, 'Recorded partial payment of 30,000 PKR');
    assert(updatedInvoice1.status === 'PARTIALLY_PAID', 'Invoice status updated to PARTIALLY_PAID');
    const remainingBalance = updatedInvoice1.totalAmount - updatedInvoice1.paidAmount;
    assert(remainingBalance === 30000, 'Remaining outstanding balance calculated accurately as 30,000 PKR');

    // Final Payment Clearing
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        paidAmount: 60000,
        status: 'PAID',
      },
    });
    const finalInvoice = await prisma.invoice.findUnique({ where: { id: invoice.id } });
    assert(finalInvoice.status === 'PAID' && finalInvoice.paidAmount === finalInvoice.totalAmount, 'Invoice status transitions to PAID upon full collection');

    // 5. Workflow D: Customer Support Ticket
    console.log('\n--- Step 5: Testing Workflow D (Customer Support Ticket) ---');
    const ticketCode = `TCK-TEST-${Date.now().toString().slice(-4)}`;
    const ticket = await prisma.ticket.create({
      data: {
        ticketCode,
        clientId: client.id,
        productId: pharmacyProduct.id,
        installationId: installation.id,
        title: 'Thermal receipt cutter alignment issue',
        description: 'Customer reports 80mm thermal receipt cutter skips every 5th printout.',
        category: 'TECHNICAL',
        priority: 'MEDIUM',
        status: 'OPEN',
        messages: {
          create: {
            sender: 'Taha Awan',
            message: 'Checked printer drivers; scheduled technician visit.',
            isInternal: true,
          },
        },
      },
      include: { messages: true },
    });

    assert(ticket.id && ticket.messages.length === 1, 'Support ticket created with internal technician log');

    // Resolve ticket
    const resolvedTicket = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status: 'RESOLVED',
        resolutionNotes: 'Updated printer USB buffer settings and re-aligned paper feeder.',
        resolvedAt: new Date(),
      },
    });
    assert(resolvedTicket.status === 'RESOLVED' && resolvedTicket.resolvedAt !== null, 'Ticket resolved with resolution notes');

    // 6. Workflow F: License Renewal
    console.log('\n--- Step 6: Testing Workflow F (License Renewal) ---');
    const previousExpiry = installation.license.expiresAt;
    const newExpiryDate = new Date(new Date(previousExpiry).getTime() + 365 * 24 * 60 * 60 * 1000);

    const renewedLicense = await prisma.license.update({
      where: { id: installation.license.id },
      data: {
        expiresAt: newExpiryDate,
        status: 'ACTIVE',
        history: {
          create: {
            action: 'RENEWED',
            notes: 'Annual license renewed for another 365 days.',
          },
        },
      },
      include: { history: true },
    });

    assert(renewedLicense.expiresAt.getTime() === newExpiryDate.getTime(), 'License expiry date extended by 365 days');
    assert(renewedLicense.history.length >= 2, 'License renewal history preserved');

    // Clean up test records
    await prisma.ticketMessage.deleteMany({ where: { ticketId: ticket.id } });
    await prisma.ticket.delete({ where: { id: ticket.id } });
    await prisma.paymentAllocation.deleteMany({ where: { invoiceId: invoice.id } });
    await prisma.payment.delete({ where: { id: payment.id } });
    await prisma.invoiceItem.deleteMany({ where: { invoiceId: invoice.id } });
    await prisma.invoice.delete({ where: { id: invoice.id } });
    await prisma.licenseHistory.deleteMany({ where: { licenseId: installation.license.id } });
    await prisma.license.delete({ where: { id: installation.license.id } });
    await prisma.installation.delete({ where: { id: installation.id } });
    await prisma.lead.delete({ where: { id: newLead.id } });
    await prisma.branch.deleteMany({ where: { clientId: client.id } });
    await prisma.client.delete({ where: { id: client.id } });

    console.log('\n====================================================');
    console.log(`   TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log('====================================================\n');

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
