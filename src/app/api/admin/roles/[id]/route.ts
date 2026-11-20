import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, isAdminUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

// PUT /api/admin/roles/[id] - Update role details and permissions (Admin only)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getCurrentUser();
    if (!admin || !isAdminUser(admin)) {
      return NextResponse.json({ error: "Access denied. Administrator privileges required." }, { status: 403 });
    }

    const { id } = await params;
    const existing = await prisma.role.findUnique({
      where: { id },
      include: { permissions: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    const body = await req.json();
    const { name, description, permissionIds } = body;

    const data: any = {};
    if (name !== undefined) data.name = name.trim();
    if (description !== undefined) data.description = description?.trim() || null;

    if (Array.isArray(permissionIds)) {
      // Re-assign role permissions
      await prisma.rolePermission.deleteMany({ where: { roleId: id } });
      await prisma.rolePermission.createMany({
        data: permissionIds.map((pId: string) => ({
          roleId: id,
          permissionId: pId,
        })),
      });
    }

    const updated = await prisma.role.update({
      where: { id },
      data,
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
      event: "ROLE_UPDATED",
      recordId: id,
      description: `Admin updated permissions/details for role "${updated.name}" (${updated.code}).`,
    });

    return NextResponse.json({ success: true, role: updated });
  } catch (err: any) {
    console.error("PUT /api/admin/roles/[id] error:", err);
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }
}
