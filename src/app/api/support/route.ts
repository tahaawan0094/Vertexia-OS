import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const clientId = searchParams.get("clientId");

    const where: any = {};
    if (status && status !== "ALL") where.status = status;
    if (priority && priority !== "ALL") where.priority = priority;
    if (clientId) where.clientId = clientId;

    const tickets = await prisma.ticket.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, clientCode: true, businessName: true, phone: true } },
        product: { select: { id: true, name: true } },
        installation: { select: { id: true, installCode: true, softwareVersion: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });

    const clients = await prisma.client.findMany({
      select: { id: true, clientCode: true, businessName: true, installations: true },
    });
    const products = await prisma.product.findMany();
    const users = await prisma.user.findMany({ select: { id: true, name: true } });

    return NextResponse.json({ tickets, clients, products, users });
  } catch (err: any) {
    console.error("GET /api/support error:", err);
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      clientId,
      productId,
      installationId,
      title,
      description,
      category = "TECHNICAL",
      priority = "MEDIUM",
      assignedToId,
    } = body;

    if (!clientId || !title?.trim()) {
      return NextResponse.json({ error: "Client and title are required" }, { status: 400 });
    }

    const count = await prisma.ticket.count();
    const ticketCode = `TCK-${4001 + count}`;

    const ticket = await prisma.ticket.create({
      data: {
        ticketCode,
        clientId,
        productId: productId || null,
        installationId: installationId || null,
        title: title.trim(),
        description: description || "No description entered",
        category,
        priority,
        status: "OPEN",
        assignedToId: assignedToId || null,
        messages: {
          create: {
            sender: user.name,
            message: `Ticket opened: ${title}`,
            isInternal: true,
          },
        },
      },
      include: { client: true, product: true },
    });

    await logActivity({
      userId: user.id,
      userName: user.name,
      module: "TICKET",
      event: "TICKET_CREATED",
      clientId,
      recordId: ticket.id,
      description: `Opened ${priority} priority ticket ${ticket.ticketCode} for ${ticket.client.businessName}: "${ticket.title}".`,
    });

    return NextResponse.json({ success: true, ticket });
  } catch (err: any) {
    console.error("POST /api/support error:", err);
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }
}
