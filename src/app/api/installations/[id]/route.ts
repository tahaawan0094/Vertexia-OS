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
    const installation = await prisma.installation.findUnique({
      where: { id },
      include: {
        client: {
          select: { id: true, clientCode: true, businessName: true, phone: true, city: true },
        },
        branch: true,
        product: true,
        license: {
          include: {
            history: { orderBy: { createdAt: "desc" } },
          },
        },
        technician: true,
        events: { orderBy: { createdAt: "desc" } },
        tickets: {
          orderBy: { createdAt: "desc" },
          include: { assignedTo: { select: { name: true } } },
        },
      },
    });

    if (!installation) {
      return NextResponse.json({ error: "Installation not found" }, { status: 404 });
    }

    return NextResponse.json({ installation });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch installation" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { status, softwareVersion, notes, renewDays } = await req.json();

    const existing = await prisma.installation.findUnique({
      where: { id },
      include: { license: true, client: true },
    });
    if (!existing) return NextResponse.json({ error: "Installation not found" }, { status: 404 });

    const updateData: any = {};
    if (status) updateData.status = status;
    if (softwareVersion) updateData.softwareVersion = softwareVersion;
    if (notes !== undefined) updateData.notes = notes;

    const updated = await prisma.installation.update({
      where: { id },
      data: updateData,
      include: { license: true },
    });

    // Handle License Renewal if renewDays passed
    if (renewDays && existing.license) {
      const currentExp = existing.license.expiresAt ? new Date(existing.license.expiresAt) : new Date();
      const baseTime = currentExp > new Date() ? currentExp.getTime() : Date.now();
      const newExpiry = new Date(baseTime + Number(renewDays) * 24 * 60 * 60 * 1000);

      await prisma.license.update({
        where: { id: existing.license.id },
        data: {
          expiresAt: newExpiry,
          status: "ACTIVE",
          history: {
            create: {
              action: "RENEWED",
              notes: `License renewed for ${renewDays} days by ${user.name}.`,
            },
          },
        },
      });

      await logActivity({
        userId: user.id,
        userName: user.name,
        module: "INSTALLATION",
        event: "LICENSE_RENEWED",
        clientId: existing.clientId,
        recordId: id,
        description: `License for ${existing.client.businessName} renewed until ${newExpiry.toLocaleDateString("en-GB")}.`,
      });
    }

    await logAudit({
      userId: user.id,
      action: "UPDATE",
      entity: "Installation",
      entityId: id,
      oldValues: existing,
      newValues: updated,
    });

    return NextResponse.json({ success: true, installation: updated });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to update installation" }, { status: 500 });
  }
}
