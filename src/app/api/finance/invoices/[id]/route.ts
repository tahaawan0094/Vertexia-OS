import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { logAudit } from "@/lib/audit";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        items: true,
        allocations: {
          include: { payment: true },
        },
      },
    });

    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    return NextResponse.json({ invoice });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch invoice" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { status, notes, paymentTerms } = await req.json();

    const existing = await prisma.invoice.findUnique({ where: { id }, include: { client: true } });
    if (!existing) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    const updateData: any = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (paymentTerms !== undefined) updateData.paymentTerms = paymentTerms;

    const updated = await prisma.invoice.update({
      where: { id },
      data: updateData,
    });

    if (status === "CANCELLED") {
      await logActivity({
        userId: user.id,
        userName: user.name,
        module: "INVOICE",
        event: "INVOICE_CANCELLED",
        clientId: existing.clientId,
        recordId: id,
        description: `Cancelled invoice ${existing.invoiceNumber} for ${existing.client.businessName}.`,
      });
    }

    await logAudit({
      userId: user.id,
      action: "UPDATE",
      entity: "Invoice",
      entityId: id,
      oldValues: existing,
      newValues: updated,
    });

    return NextResponse.json({ success: true, invoice: updated });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
  }
}
