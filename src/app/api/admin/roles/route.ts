import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, isAdminUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

// GET /api/admin/roles - Fetch all roles with assigned user count and permissions (Admin only)
export async function GET() {
  try {
    const admin = await getCurrentUser();
    if (!admin || !isAdminUser(admin)) {
      return NextResponse.json({ error: "Access denied. Administrator privileges required." }, { status: 403 });
    }

    const roles = await prisma.role.findMany({
      include: {
        _count: {
          select: { users: true },
        },
        permissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const allPermissions = await prisma.permission.findMany({
      orderBy: [{ module: "asc" }, { action: "asc" }],
    });

    return NextResponse.json({ roles, allPermissions });
  } catch (err: any) {
    console.error("GET /api/admin/roles error:", err);
    return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 });
  }
}

// POST /api/admin/roles - Create custom role (Admin only)
export async function POST(req: Request) {
  try {
    const admin = await getCurrentUser();
    if (!admin || !isAdminUser(admin)) {
      return NextResponse.json({ error: "Access denied. Administrator privileges required." }, { status: 403 });
    }

    const body = await req.json();
    const { name, code, description, permissionIds = [] } = body;

    if (!name?.trim() || !code?.trim()) {
      return NextResponse.json({ error: "Role name and role code are required." }, { status: 400 });
    }

    const upperCode = code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_");

    const existing = await prisma.role.findUnique({
      where: { code: upperCode },
    });

    if (existing) {
      return NextResponse.json({ error: "A role with this code already exists." }, { status: 400 });
    }

    const newRole = await prisma.role.create({
      data: {
        name: name.trim(),
        code: upperCode,
        description: description?.trim() || null,
        isSystem: false,
        permissions: {
          create: permissionIds.map((pId: string) => ({
            permissionId: pId,
          })),
        },
      },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });

    await logActivity({
      userId: admin.id,
      userName: admin.name,
      module: "SYSTEM",
      event: "ROLE_CREATED",
      recordId: newRole.id,
      description: `Admin created custom role "${newRole.name}" (${newRole.code}) with ${permissionIds.length} permissions.`,
    });

    return NextResponse.json({ success: true, role: newRole });
  } catch (err: any) {
    console.error("POST /api/admin/roles error:", err);
    return NextResponse.json({ error: "Failed to create role" }, { status: 500 });
  }
}
