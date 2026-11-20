import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { logAudit } from "@/lib/audit";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const clientId = searchParams.get("clientId");
    const search = searchParams.get("search")?.trim();

    const where: any = {};
    if (status && status !== "ALL") where.status = status;
    if (clientId) where.clientId = clientId;
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search } },
        { client: { businessName: { contains: search } } },
      ];
    }

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { issueDate: "desc" },
      include: {
        client: { select: { id: true, clientCode: true, businessName: true, phone: true } },
        items: true,
        allocations: {
          include: { payment: true },
        },
      },
    });

    const clients = await prisma.client.findMany({
      select: { id: true, clientCode: true, businessName: true },
    });

    return NextResponse.json({ invoices, clients });
  } catch (err: any) {
    console.error("GET /api/finance/invoices error:", err);
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      clientId,
      issueDate = new Date(),
      dueDate,
      items = [],
      discount = 0,
      tax = 0,
      notes,
      paymentTerms = "Due on receipt",
    } = body;

    if (!clientId) {
      return NextResponse.json({ error: "Client is required" }, { status: 400 });
    }
    if (!items || items.length === 0) {
      return NextResponse.json({ error: "At least one line item is required" }, { status: 400 });
    }

    // Server-side validation of totals
    let subtotal = 0;
    const validatedItems = items.map((item: any) => {
      const qty = Math.max(1, Number(item.quantity) || 1);
      const unit = Math.max(0, Number(item.unitPrice) || 0);
      const lineAmount = qty * unit;
      subtotal += lineAmount;
      return {
        description: item.description || "Software License / Service",
        quantity: qty,
        unitPrice: unit,
        amount: lineAmount,
      };
    });

    const disc = Math.max(0, Number(discount) || 0);
    const tx = Math.max(0, Number(tax) || 0);
    const totalAmount = Math.max(0, subtotal - disc + tx);

    // Generate invoice number: INV-2026-001 + count
    const year = new Date().getFullYear();
    const count = await prisma.invoice.count();
    const invoiceNumber = `INV-${year}-${String(count + 1).padStart(3, "0")}`;

    const calculatedDueDate = dueDate ? new Date(dueDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        clientId,
        issueDate: new Date(issueDate),
        dueDate: calculatedDueDate,
        subtotal,
        discount: disc,
        tax: tx,
        totalAmount,
        paidAmount: 0,
        currency: "PKR",
        status: "SENT",
        notes,
        paymentTerms,
        items: {
          create: validatedItems,
        },
      },
      include: { client: true, items: true },
    });

    await logActivity({
      userId: user.id,
      userName: user.name,
      module: "INVOICE",
      event: "INVOICE_GENERATED",
      clientId,
      recordId: invoice.id,
      description: `Generated invoice ${invoice.invoiceNumber} for ${invoice.client.businessName} (Total: PKR ${invoice.totalAmount.toLocaleString()}).`,
    });

    await logAudit({
      userId: user.id,
      action: "CREATE",
      entity: "Invoice",
      entityId: invoice.id,
      newValues: invoice,
    });

    return NextResponse.json({ success: true, invoice });
  } catch (err: any) {
    console.error("POST /api/finance/invoices error:", err);
    return NextResponse.json({ error: "Failed to generate invoice" }, { status: 500 });
  }
}
