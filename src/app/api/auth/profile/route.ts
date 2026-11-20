import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, hashPassword, verifyPassword } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { logAudit } from "@/lib/audit";

// GET /api/auth/profile - Fetch current authenticated user's profile
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        role: true,
        employee: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role.name,
        roleCode: dbUser.role.code,
        employee: dbUser.employee,
      },
    });
  } catch (err: any) {
    console.error("GET /api/auth/profile error:", err);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

// PUT /api/auth/profile - Update own username, email, or password
export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.user.findUnique({
      where: { id: user.id },
      include: { role: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "User account not found" }, { status: 404 });
    }

    const body = await req.json();
    const { name, email, currentPassword, newPassword } = body;

    const data: any = {};

    if (name && name.trim()) {
      data.name = name.trim();
    }

    if (email && email.trim()) {
      const lower = email.trim().toLowerCase();
      if (lower !== existing.email) {
        const conflict = await prisma.user.findUnique({ where: { email: lower } });
        if (conflict) {
          return NextResponse.json({ error: "Email address is already in use by another account." }, { status: 400 });
        }
        data.email = lower;
      }
    }

    // If new password is provided, verify current password first if not founder/admin override
    if (newPassword && newPassword.trim()) {
      if (newPassword.trim().length < 8) {
        return NextResponse.json({ error: "New password must be at least 8 characters long." }, { status: 400 });
      }

      if (currentPassword) {
        const isMatch = await verifyPassword(currentPassword, existing.passwordHash);
        if (!isMatch) {
          return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
        }
      }

      data.passwordHash = await hashPassword(newPassword.trim());
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data,
      include: { role: true, employee: true },
    });

    await logActivity({
      userId: user.id,
      userName: updated.name,
      module: "SYSTEM",
      event: "PROFILE_UPDATED",
      recordId: user.id,
      description: `User "${updated.name}" updated their profile credentials.`,
    });

    await logAudit({
      userId: user.id,
      action: "UPDATE",
      entity: "User",
      entityId: user.id,
      newValues: { name: updated.name, email: updated.email },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role.name,
        roleCode: updated.role.code,
      },
    });
  } catch (err: any) {
    console.error("PUT /api/auth/profile error:", err);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
