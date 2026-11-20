import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, isAdminUser, hashPassword } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { logAudit } from "@/lib/audit";

// PUT /api/admin/users/[id] - Edit user profile, role, or active status (Admin only)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getCurrentUser();
    if (!admin || !isAdminUser(admin)) {
      return NextResponse.json({ error: "Access denied. Administrator privileges required." }, { status: 403 });
    }

    const { id } = await params;
    const existing = await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { name, email, roleId, employeeId, isActive, password, newPassword } = body;

    const data: any = {};
    if (name !== undefined) data.name = name.trim();
    if (email !== undefined) {
      const lower = email.trim().toLowerCase();
      if (lower !== existing.email) {
        const conflict = await prisma.user.findUnique({ where: { email: lower } });
        if (conflict) {
          return NextResponse.json({ error: "Email is already taken by another user" }, { status: 400 });
        }
      }
      data.email = lower;
    }

    const pwdToUpdate = password || newPassword;
    if (pwdToUpdate !== undefined && pwdToUpdate.trim().length > 0) {
      if (pwdToUpdate.trim().length < 8) {
        return NextResponse.json({ error: "Password must be at least 8 characters long." }, { status: 400 });
      }
      data.passwordHash = await hashPassword(pwdToUpdate.trim());
      // If changing another user's password, invalidate their sessions
      if (id !== admin.id) {
        await prisma.session.deleteMany({ where: { userId: id } });
      }
    }

    if (roleId !== undefined) data.roleId = roleId;
    if (employeeId !== undefined) data.employeeId = employeeId || null;
    if (isActive !== undefined) {
      // Prevent deactivating own account
      if (id === admin.id && !isActive) {
        return NextResponse.json({ error: "You cannot deactivate your own administrative account." }, { status: 400 });
      }
      data.isActive = Boolean(isActive);
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      include: { role: true, employee: true },
    });

    await logActivity({
      userId: admin.id,
      userName: admin.name,
      module: "SYSTEM",
      event: "USER_UPDATED",
      recordId: id,
      description: `Admin updated account "${updated.name}" (${updated.email}). Role: ${updated.role.name}, Status: ${updated.isActive ? "ACTIVE" : "INACTIVE"}.`,
    });

    await logAudit({
      userId: admin.id,
      action: "UPDATE",
      entity: "User",
      entityId: id,
      oldValues: existing,
      newValues: updated,
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (err: any) {
    console.error("PUT /api/admin/users/[id] error:", err);
    return NextResponse.json({ error: "Failed to update user account" }, { status: 500 });
  }
}

// DELETE /api/admin/users/[id] - Permanently delete user account (Admin only)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getCurrentUser();
    if (!admin || !isAdminUser(admin)) {
      return NextResponse.json({ error: "Access denied. Administrator privileges required." }, { status: 403 });
    }

    const { id } = await params;
    if (id === admin.id) {
      return NextResponse.json({ error: "You cannot delete your own administrative account." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Clean up dependent sessions and relations
    await prisma.session.deleteMany({ where: { userId: id } });
    await prisma.notification.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });

    await logActivity({
      userId: admin.id,
      userName: admin.name,
      module: "SYSTEM",
      event: "USER_DELETED",
      recordId: id,
      description: `Admin deleted user account "${existing.name}" (${existing.email}).`,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/admin/users/[id] error:", err);
    return NextResponse.json({ error: "Failed to delete user account" }, { status: 500 });
  }
}
