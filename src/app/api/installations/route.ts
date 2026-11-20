import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { logAudit } from "@/lib/audit";
import crypto from "crypto";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    const status = searchParams.get("status");
    const clientId = searchParams.get("clientId");
    const search = searchParams.get("search")?.trim();

    const where: any = {};
    if (productId && productId !== "ALL") where.productId = productId;
    if (status && status !== "ALL") where.status = status;
    if (clientId) where.clientId = clientId;
    if (search) {
      where.OR = [
        { installCode: { contains: search } },
        { client: { businessName: { contains: search } } },
        { license: { licenseKey: { contains: search } } },
      ];
    }

    const installations = await prisma.installation.findMany({
      where,
      orderBy: { installationDate: "desc" },
      include: {
        client: { select: { id: true, clientCode: true, businessName: true, city: true } },
        branch: { select: { id: true, name: true } },
        product: { select: { id: true, productCode: true, name: true } },
        license: true,
        technician: { select: { id: true, name: true } },
      },
    });

    const products = await prisma.product.findMany();
    const clients = await prisma.client.findMany({
      select: { id: true, clientCode: true, businessName: true, branches: true },
    });
    const employees = await prisma.employee.findMany({ where: { status: "ACTIVE" } });

    return NextResponse.json({ installations, products, clients, employees });
  } catch (err: any) {
    console.error("GET /api/installations error:", err);
    return NextResponse.json({ error: "Failed to fetch installations" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      clientId,
      branchId,
      productId,
      softwareVersion = "1.0.0",
      licenseType = "LIFETIME",
      technicianId,
      notes,
    } = body;

    if (!clientId || !productId) {
      return NextResponse.json({ error: "Client and Product are required" }, { status: 400 });
    }

    const count = await prisma.installation.count();
    const installCode = `INS-${5001 + count}`;

    // Generate unique license key: VTX-XXXX-XXXX-XXXX
    const rawHash = crypto.randomBytes(6).toString("hex").toUpperCase();
    const licenseKey = `VTX-${rawHash.slice(0, 4)}-${rawHash.slice(4, 8)}-${rawHash.slice(8, 12)}`;

    // Set expiration based on license type
    let expiresAt: Date | null = null;
    if (licenseType === "MONTHLY") {
      expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    } else if (licenseType === "YEARLY") {
      expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    } else if (licenseType === "TRIAL") {
      expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    }

    const installation = await prisma.installation.create({
      data: {
        installCode,
        clientId,
        branchId: branchId || null,
        productId,
        softwareVersion,
        technicianId: technicianId || null,
        status: "ACTIVE",
        healthStatus: "UNKNOWN", // Honest: no fake ping
        notes,
        license: {
          create: {
            licenseKey,
            type: licenseType,
            status: "ACTIVE",
            activatedAt: new Date(),
            expiresAt,
            history: {
              create: {
                action: "ISSUED",
                notes: `License issued for ${licenseType} deployment.`,
              },
            },
          },
        },
        events: {
          create: {
            eventType: "INSTALL",
            description: `Initial installation registered with license ${licenseKey}.`,
          },
        },
      },
      include: { client: true, product: true, license: true },
    });

    await logActivity({
      userId: user.id,
      userName: user.name,
      module: "INSTALLATION",
      event: "INSTALLATION_CREATED",
      clientId,
      recordId: installation.id,
      description: `Deployed ${installation.product.name} at ${installation.client.businessName} (Install Code: ${installCode}).`,
    });

    await logAudit({
      userId: user.id,
      action: "CREATE",
      entity: "Installation",
      entityId: installation.id,
      newValues: installation,
    });

    return NextResponse.json({ success: true, installation });
  } catch (err: any) {
    console.error("POST /api/installations error:", err);
    return NextResponse.json({ error: "Failed to register installation" }, { status: 500 });
  }
}
