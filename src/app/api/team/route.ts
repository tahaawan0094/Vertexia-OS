import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { logAudit } from "@/lib/audit";

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
      orderBy: { createdAt: "asc" },
    });

    const roles = await prisma.role.findMany({
      include: {
        permissions: { include: { permission: true } },
      },
    });

    const departments = await prisma.department.findMany({
      include: { _count: { select: { employees: true } } },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ employees, roles, departments });
  } catch (err: any) {
    console.error("GET /api/team error:", err);
    return NextResponse.json({ error: "Failed to fetch team data" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, jobTitle, departmentId, email, phone, status = "ACTIVE", notes } = body;

    if (!name?.trim() || !jobTitle?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: "Name, job title, and official email are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await prisma.employee.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An employee with this email address already exists." },
        { status: 400 }
      );
    }

    // Generate unique employee code
    const count = await prisma.employee.count();
    let employeeCode = `VTX-${String(count + 1).padStart(3, "0")}`;
    const codeConflict = await prisma.employee.findUnique({ where: { employeeCode } });
    if (codeConflict) {
      employeeCode = `VTX-${Date.now().toString().slice(-4)}`;
    }

    const newEmployee = await prisma.employee.create({
      data: {
        employeeCode,
        name: name.trim(),
        jobTitle: jobTitle.trim(),
        email: cleanEmail,
        phone: phone?.trim() || null,
        departmentId: departmentId || null,
        status: status || "ACTIVE",
        notes: notes?.trim() || null,
      },
      include: {
        department: true,
      },
    });

    await logActivity({
      userId: user.id,
      userName: user.name,
      module: "SYSTEM",
      event: "EMPLOYEE_CREATED",
      recordId: newEmployee.id,
      description: `Added new team member "${newEmployee.name}" (${newEmployee.jobTitle}) in ${newEmployee.department?.name || "General"}.`,
    });

    await logAudit({
      userId: user.id,
      action: "CREATE",
      entity: "Employee" as any,
      entityId: newEmployee.id,
      newValues: { name: newEmployee.name, email: newEmployee.email, jobTitle: newEmployee.jobTitle },
    });

    return NextResponse.json({ success: true, employee: newEmployee });
  } catch (err: any) {
    console.error("POST /api/team error:", err);
    return NextResponse.json({ error: "Failed to create team member" }, { status: 500 });
  }
}
