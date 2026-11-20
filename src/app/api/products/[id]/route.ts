import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        features: true,
        pricingPlans: true,
        versions: { orderBy: { releaseDate: "desc" } },
        installations: {
          include: {
            client: { select: { id: true, businessName: true, clientCode: true } },
            license: true,
          },
        },
        projects: {
          include: {
            tasks: { select: { id: true, status: true } },
          },
        },
        tickets: {
          include: {
            client: { select: { businessName: true } },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: body.name,
        tagline: body.tagline,
        description: body.description,
        status: body.status,
        currentVersion: body.currentVersion,
      },
    });

    await logActivity({
      userId: user.id,
      userName: user.name,
      module: "SYSTEM",
      event: "PRODUCT_UPDATED",
      recordId: id,
      description: `Updated product "${updated.name}" details/status (${updated.status}).`,
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

// Add feature, version, or pricing plan
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { action, data } = await req.json();

    if (action === "ADD_FEATURE") {
      const feat = await prisma.productFeature.create({
        data: {
          productId: id,
          title: data.title,
          description: data.description,
          isHighlight: !!data.isHighlight,
        },
      });
      return NextResponse.json({ success: true, feature: feat });
    }

    if (action === "ADD_VERSION") {
      const ver = await prisma.productVersion.create({
        data: {
          productId: id,
          versionNumber: data.versionNumber,
          releaseNotes: data.releaseNotes,
          status: data.status || "STABLE",
        },
      });
      // Optionally update currentVersion on product
      await prisma.product.update({
        where: { id },
        data: { currentVersion: data.versionNumber },
      });
      return NextResponse.json({ success: true, version: ver });
    }

    if (action === "ADD_PRICING") {
      const plan = await prisma.pricingPlan.create({
        data: {
          productId: id,
          name: data.name,
          licenseType: data.licenseType || "LIFETIME",
          price: Number(data.price) || 0,
          currency: data.currency || "PKR",
          billingCycle: data.billingCycle || "ONE_TIME",
          description: data.description,
        },
      });
      return NextResponse.json({ success: true, plan });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to process sub-entity" }, { status: 500 });
  }
}
