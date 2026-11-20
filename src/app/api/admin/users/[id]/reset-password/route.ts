import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, isAdminUser, hashPassword } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { logAudit } from "@/lib/audit";

// POST /api/admin/users/[id]/reset-password - Admin reset password for any user account
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getCurrentUser();
    if (!admin || !isAdminUser(admin)) {
      return NextResponse.json({ error: "Access denied. Administrator privileges required." }, { status: 403 });
    }

    const { id } = await params;
    const existing = await prisma.user.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { newPassword } = body;

    if (!newPassword || newPassword.trim().length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(newPassword.trim());

    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    // Invalidate existing sessions for security
    await prisma.session.deleteMany({ where: { userId: id } });

    await logActivity({
      userId: admin.id,
      userName: admin.name,
      module: "SYSTEM",
      event: "PASSWORD_RESET",
      recordId: id,
      description: `Admin reset password for user account "${existing.name}" (${existing.email}). Previous sessions invalidated.`,
    });

    await logAudit({
      userId: admin.id,
      action: "UPDATE",
      entity: "User",
      entityId: id,
      newValues: { action: "PASSWORD_RESET_BY_ADMIN" },
    });

    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (err: any) {
    console.error("POST /api/admin/users/[id]/reset-password error:", err);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
