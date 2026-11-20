import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const employees = await prisma.employee.findMany({
      include: {
        department: true,
        user: {
          select: { id: true, email: true, role: true, isActive: true },
        },
      },
    });

    const roles = await prisma.role.findMany({
      include: {
        permissions: { include: { permission: true } },
      },
    });

    const departments = await prisma.department.findMany({
      include: { _count: { select: { employees: true } } },
    });

    return NextResponse.json({ employees, roles, departments });
  } catch (err: any) {
    console.error("GET /api/team error:", err);
    return NextResponse.json({ error: "Failed to fetch team data" }, { status: 500 });
  }
}
