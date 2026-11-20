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
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        branches: {
          include: {
            installations: {
              include: { product: true, license: true },
            },
          },
        },
        installations: {
          include: {
            product: true,
            branch: true,
            license: true,
            technician: { select: { name: true } },
          },
        },
        invoices: {
          orderBy: { issueDate: "desc" },
          include: { items: true, allocations: true },
        },
        payments: {
          orderBy: { paymentDate: "desc" },
          include: { allocations: true },
        },
        tickets: {
          orderBy: { createdAt: "desc" },
          include: { product: true, assignedTo: { select: { name: true } } },
        },
        deals: {
          include: { product: true },
        },
        activities: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const totalInvoiced = client.invoices
      .filter((i) => i.status !== "CANCELLED")
      .reduce((sum, i) => sum + i.totalAmount, 0);
    const totalPaid = client.invoices
      .filter((i) => i.status !== "CANCELLED")
      .reduce((sum, i) => sum + i.paidAmount, 0);
    const balanceDue = Math.max(0, totalInvoiced - totalPaid);

    const products = await prisma.product.findMany();
    const employees = await prisma.employee.findMany({ where: { status: "ACTIVE" } });

    return NextResponse.json({
      client: {
        ...client,
        totalInvoiced,
        totalPaid,
        balanceDue,
      },
      products,
      employees,
    });
  } catch (err: any) {
    console.error("GET /api/clients/[id] error:", err);
    return NextResponse.json({ error: "Failed to fetch client details" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.client.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Client not found" }, { status: 404 });

    const updated = await prisma.client.update({
      where: { id },
      data: {
        businessName: body.businessName !== undefined ? body.businessName : existing.businessName,
        contactPerson: body.contactPerson !== undefined ? body.contactPerson : existing.contactPerson,
        phone: body.phone !== undefined ? body.phone : existing.phone,
        whatsapp: body.whatsapp !== undefined ? body.whatsapp : existing.whatsapp,
        email: body.email !== undefined ? body.email : existing.email,
        address: body.address !== undefined ? body.address : existing.address,
        city: body.city !== undefined ? body.city : existing.city,
        status: body.status !== undefined ? body.status : existing.status,
        notes: body.notes !== undefined ? body.notes : existing.notes,
      },
    });

    await logActivity({
      userId: user.id,
      userName: user.name,
      module: "CLIENT",
      event: "CLIENT_UPDATED",
      clientId: id,
      recordId: id,
      description: `Updated profile details for client ${updated.businessName}.`,
    });

    return NextResponse.json({ success: true, client: updated });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const existing = await prisma.client.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Client not found" }, { status: 404 });

    // Clean up all related child entities in cascade order
    await prisma.ticketMessage.deleteMany({ where: { ticket: { clientId: id } } });
    await prisma.ticket.deleteMany({ where: { clientId: id } });
    await prisma.installationEvent.deleteMany({ where: { installation: { clientId: id } } });
    await prisma.licenseHistory.deleteMany({ where: { license: { installation: { clientId: id } } } });
    await prisma.license.deleteMany({ where: { installation: { clientId: id } } });
    await prisma.installation.deleteMany({ where: { clientId: id } });
    await prisma.paymentAllocation.deleteMany({ where: { invoice: { clientId: id } } });
    await prisma.payment.deleteMany({ where: { clientId: id } });
    await prisma.invoiceItem.deleteMany({ where: { invoice: { clientId: id } } });
    await prisma.invoice.deleteMany({ where: { clientId: id } });
    await prisma.dealProduct.deleteMany({ where: { deal: { clientId: id } } });
    await prisma.deal.deleteMany({ where: { clientId: id } });
    await prisma.followup.deleteMany({ where: { clientId: id } });
    await prisma.activity.deleteMany({ where: { clientId: id } });
    await prisma.branch.deleteMany({ where: { clientId: id } });
    await prisma.client.delete({ where: { id } });

    await logActivity({
      userId: user.id,
      userName: user.name,
      module: "CLIENT",
      event: "CLIENT_DELETED",
      recordId: id,
      description: `Deleted client ${existing.businessName} (${existing.clientCode}).`,
    });

    await logAudit({
      userId: user.id,
      action: "DELETE",
      entity: "Client",
      entityId: id,
      oldValues: existing,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/clients/[id] error:", err);
    return NextResponse.json({ error: "Failed to delete client" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { name, code, address, city, contactPerson, phone } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: "Branch name is required" }, { status: 400 });
    }

    const branch = await prisma.branch.create({
      data: {
        clientId: id,
        name: name.trim(),
        code: code || null,
        address,
        city: city || "Karachi",
        contactPerson,
        phone,
      },
    });

    await logActivity({
      userId: user.id,
      userName: user.name,
      module: "CLIENT",
      event: "BRANCH_ADDED",
      clientId: id,
      recordId: branch.id,
      description: `Added new branch "${branch.name}" for client.`,
    });

    return NextResponse.json({ success: true, branch });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to add branch" }, { status: 500 });
  }
}
