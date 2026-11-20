import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const projects = await prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        product: true,
        tasks: {
          include: { assignedTo: { select: { id: true, name: true } } },
        },
      },
    });

    const products = await prisma.product.findMany();
    const users = await prisma.user.findMany({ select: { id: true, name: true, role: true } });

    return NextResponse.json({ projects, products, users });
  } catch (err: any) {
    console.error("GET /api/projects error:", err);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, type = "INTERNAL", productId, description, managerName, priority = "MEDIUM", deadline } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    const count = await prisma.project.count();
    const projectCode = `PRJ-${9001 + count}`;

    const project = await prisma.project.create({
      data: {
        projectCode,
        name: name.trim(),
        type,
        productId: productId || null,
        description,
        managerName: managerName || user.name,
        priority,
        deadline: deadline ? new Date(deadline) : null,
        status: "IN_PROGRESS",
      },
      include: { product: true },
    });

    await logActivity({
      userId: user.id,
      userName: user.name,
      module: "PROJECT",
      event: "PROJECT_CREATED",
      recordId: project.id,
      description: `Created new ${type.toLowerCase()} project "${project.name}" (Code: ${projectCode}).`,
    });

    return NextResponse.json({ success: true, project });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
