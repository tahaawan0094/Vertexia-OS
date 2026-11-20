import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { logAudit } from "@/lib/audit";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { leadId, branchName = "Main Branch", createInitialInvoice, invoiceAmount, productId } = await req.json();

    if (!leadId) {
      return NextResponse.json({ error: "Lead ID is required" }, { status: 400 });
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { convertedClient: true },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    if (lead.convertedClientId) {
      return NextResponse.json(
        { error: "This lead has already been converted to a client", clientId: lead.convertedClientId },
        { status: 400 }
      );
    }

    // Check if client with identical business name already exists
    let client = await prisma.client.findFirst({
      where: {
        businessName: { equals: lead.businessName },
      },
    });

    if (!client) {
      // Generate client code: CLI-3001 + count
      const clientCount = await prisma.client.count();
      const clientCode = `CLI-${3001 + clientCount}`;

      client = await prisma.client.create({
        data: {
          clientCode,
          businessName: lead.businessName,
          businessCategory: lead.businessCategory,
          contactPerson: lead.contactPerson || lead.businessName,
          phone: lead.phone || "N/A",
          whatsapp: lead.whatsapp,
          email: lead.email,
          address: lead.address,
          city: lead.city || "Karachi",
          country: lead.country || "Pakistan",
          status: "ACTIVE",
          notes: `Converted from Lead ${lead.leadCode}.`,
          branches: {
            create: {
              name: branchName,
              code: "BR-01",
              address: lead.address,
              city: lead.city || "Karachi",
              contactPerson: lead.contactPerson,
              phone: lead.phone,
            },
          },
        },
      });
    }

    // Link lead to client and mark lead as WON
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        convertedClientId: client.id,
        status: "WON",
      },
    });

    // Log activity
    await logActivity({
      userId: user.id,
      userName: user.name,
      module: "CLIENT",
      event: "LEAD_CONVERTED",
      leadId: lead.id,
      clientId: client.id,
      recordId: client.id,
      description: `Successfully converted Lead ${lead.leadCode} (${lead.businessName}) into active Client ${client.clientCode}.`,
    });

    await logAudit({
      userId: user.id,
      action: "LEAD_CONVERSION",
      entity: "Client",
      entityId: client.id,
      newValues: { clientCode: client.clientCode, leadCode: lead.leadCode, businessName: client.businessName },
    });

    return NextResponse.json({
      success: true,
      clientId: client.id,
      clientCode: client.clientCode,
      message: `Lead converted successfully to client ${client.clientCode}`,
    });
  } catch (err: any) {
    console.error("POST /api/crm/convert error:", err);
    return NextResponse.json({ error: "Failed to convert lead to customer" }, { status: 500 });
  }
}
