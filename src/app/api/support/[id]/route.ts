import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        client: true,
        product: true,
        installation: true,
        assignedTo: true,
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

    const users = await prisma.user.findMany({ select: { id: true, name: true } });

    return NextResponse.json({ ticket, users });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch ticket" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { status, priority, assignedToId, resolutionNotes } = await req.json();

    const data: any = {};
    if (status) {
      data.status = status;
      if (status === "RESOLVED" || status === "CLOSED") {
        data.resolvedAt = new Date();
      }
    }
    if (priority) data.priority = priority;
    if (assignedToId !== undefined) data.assignedToId = assignedToId;
    if (resolutionNotes) data.resolutionNotes = resolutionNotes;

    const updated = await prisma.ticket.update({
      where: { id },
      data,
      include: { client: true },
    });

    if (status === "RESOLVED") {
      await logActivity({
        userId: user.id,
        userName: user.name,
        module: "TICKET",
        event: "TICKET_RESOLVED",
        clientId: updated.clientId,
        recordId: id,
        description: `Resolved ticket ${updated.ticketCode} for ${updated.client.businessName}.`,
      });
    }

    return NextResponse.json({ success: true, ticket: updated });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
  }
}

// Post conversation message or internal technician note
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { message, isInternal = true } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const msg = await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        sender: user.name,
        message: message.trim(),
        isInternal: !!isInternal,
      },
    });

    return NextResponse.json({ success: true, message: msg });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to post message" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: { client: true },
    });
    if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

    await prisma.ticketMessage.deleteMany({ where: { ticketId: id } });
    await prisma.ticket.delete({ where: { id } });

    await logActivity({
      userId: user.id,
      userName: user.name,
      module: "TICKET",
      event: "TICKET_DELETED",
      clientId: ticket.clientId,
      recordId: id,
      description: `Deleted support ticket ${ticket.ticketCode} (${ticket.title}).`,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to delete ticket" }, { status: 500 });
  }
}
