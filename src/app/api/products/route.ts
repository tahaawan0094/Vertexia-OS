import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const products = await prisma.product.findMany({
      include: {
        category: true,
        features: true,
        pricingPlans: true,
        versions: { orderBy: { releaseDate: "desc" } },
        installations: {
          select: { id: true, status: true },
        },
        _count: {
          select: { installations: true, tickets: true, projects: true },
        },
      },
    });

    const categories = await prisma.productCategory.findMany();

    return NextResponse.json({ products, categories });
  } catch (err: any) {
    console.error("GET /api/products error:", err);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, tagline, description, categoryId, status = "PLANNING", currentVersion = "1.0.0" } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 });
    }

    const code = `PRD-${name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8)}`;

    const product = await prisma.product.create({
      data: {
        productCode: code,
        name: name.trim(),
        tagline,
        description,
        categoryId: categoryId || null,
        status,
        currentVersion,
      },
    });

    await logActivity({
      userId: user.id,
      userName: user.name,
      module: "SYSTEM",
      event: "PRODUCT_CREATED",
      recordId: product.id,
      description: `Registered new product "${product.name}" in portfolio.`,
    });

    return NextResponse.json({ success: true, product });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
