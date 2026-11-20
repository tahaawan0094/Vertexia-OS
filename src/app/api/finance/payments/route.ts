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
    const clientId = searchParams.get("clientId");

    const where: any = {};
    if (clientId) where.clientId = clientId;

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { paymentDate: "desc" },
      include: {
        client: { select: { id: true, clientCode: true, businessName: true } },
        allocations: {
          include: {
            invoice: { select: { id: true, invoiceNumber: true, totalAmount: true } },
          },
        },
      },
    });

    return NextResponse.json({ payments });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      clientId,
      invoiceId,
      amount,
      paymentMethod = "BANK_TRANSFER",
      referenceNo,
      notes,
    } = body;

    const paymentAmount = Number(amount);
    if (!clientId || !paymentAmount || paymentAmount <= 0) {
      return NextResponse.json({ error: "Client and valid payment amount are required" }, { status: 400 });
    }

    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

    const count = await prisma.payment.count();
    const paymentCode = `PAY-${7001 + count}`;

    // Perform database transaction for atomic payment and invoice balance update
    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          paymentCode,
          clientId,
          amount: paymentAmount,
          currency: "PKR",
          paymentMethod,
          referenceNo,
          receivedBy: user.name,
          status: "COMPLETED",
          notes,
        },
      });

      // If an invoice is targeted, allocate payment and update invoice status
      if (invoiceId) {
        const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } });
        if (invoice) {
          await tx.paymentAllocation.create({
            data: {
              paymentId: payment.id,
              invoiceId: invoice.id,
              amount: paymentAmount,
            },
          });

          const newPaidAmount = invoice.paidAmount + paymentAmount;
          let newStatus = invoice.status;
          if (newPaidAmount >= invoice.totalAmount) {
            newStatus = "PAID";
          } else if (newPaidAmount > 0) {
            newStatus = "PARTIALLY_PAID";
          }

          await tx.invoice.update({
            where: { id: invoiceId },
            data: {
              paidAmount: newPaidAmount,
              status: newStatus,
            },
          });
        }
      }

      return payment;
    });

    await logActivity({
      userId: user.id,
      userName: user.name,
      module: "PAYMENT",
      event: "PAYMENT_RECORDED",
      clientId,
      recordId: result.id,
      description: `Recorded payment ${result.paymentCode} of PKR ${paymentAmount.toLocaleString()} via ${paymentMethod} from ${client.businessName}.`,
    });

    await logAudit({
      userId: user.id,
      action: "CREATE",
      entity: "Payment",
      entityId: result.id,
      newValues: result,
    });

    return NextResponse.json({ success: true, payment: result });
  } catch (err: any) {
    console.error("POST /api/finance/payments error:", err);
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }
}
