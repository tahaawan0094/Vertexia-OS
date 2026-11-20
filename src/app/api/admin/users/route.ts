import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, isAdminUser, hashPassword } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { logAudit } from "@/lib/audit";

// GET /api/admin/users - List all users (Admin only)
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdminUser(user)) {
      return NextResponse.json({ error: "Access denied. Administrator privileges required." }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        employee: {
          select: {
            id: true,
            name: true,
            jobTitle: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const roles = await prisma.role.findMany({
      select: { id: true, name: true, code: true, description: true },
      orderBy: { name: "asc" },
    });

    const employees = await prisma.employee.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, jobTitle: true, email: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ users, roles, employees });
  } catch (err: any) {
    console.error("GET /api/admin/users error:", err);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// POST /api/admin/users - Create new user account (Admin only)
export async function POST(req: Request) {
  try {
    const admin = await getCurrentUser();
    if (!admin || !isAdminUser(admin)) {
      return NextResponse.json({ error: "Access denied. Administrator privileges required." }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, password, roleId, employeeId, isActive = true } = body;

    if (!name?.trim() || !email?.trim() || !password?.trim() || !roleId) {
      return NextResponse.json(
        { error: "Name, email, password, and role are required." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A user account with this email address already exists." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        roleId,
        employeeId: employeeId || null,
        isActive: Boolean(isActive),
      },
      include: {
        role: true,
        employee: true,
      },
    });

    await logActivity({
      userId: admin.id,
      userName: admin.name,
      module: "SYSTEM",
      event: "USER_CREATED",
      recordId: newUser.id,
      description: `Admin created user account "${newUser.name}" (${newUser.email}) with role ${newUser.role.name}.`,
    });

    await logAudit({
      userId: admin.id,
      action: "CREATE",
      entity: "User",
      entityId: newUser.id,
      newValues: { name: newUser.name, email: newUser.email, role: newUser.role.name },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        isActive: newUser.isActive,
        role: newUser.role,
        employee: newUser.employee,
      },
    });
  } catch (err: any) {
    console.error("POST /api/admin/users error:", err);
    return NextResponse.json({ error: "Failed to create user account" }, { status: 500 });
  }
}
