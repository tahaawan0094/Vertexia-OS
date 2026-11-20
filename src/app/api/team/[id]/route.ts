import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { logAudit } from "@/lib/audit";

// PUT /api/team/[id] - Update team member
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const existing = await prisma.employee.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Team member not found" }, { status: 404 });
    }

    const body = await req.json();
    const { name, jobTitle, departmentId, email, phone, status, notes } = body;

    const data: any = {};
    if (name !== undefined) data.name = name.trim();
    if (jobTitle !== undefined) data.jobTitle = jobTitle.trim();
    if (departmentId !== undefined) data.departmentId = departmentId || null;
    if (phone !== undefined) data.phone = phone?.trim() || null;
    if (status !== undefined) data.status = status;
    if (notes !== undefined) data.notes = notes?.trim() || null;

    if (email !== undefined) {
      const cleanEmail = email.trim().toLowerCase();
      if (cleanEmail !== existing.email) {
        const conflict = await prisma.employee.findUnique({ where: { email: cleanEmail } });
        if (conflict) {
          return NextResponse.json({ error: "Email is already taken by another team member" }, { status: 400 });
        }
      }
      data.email = cleanEmail;
    }

    const updated = await prisma.employee.update({
      where: { id },
      data,
      include: {
        department: true,
      },
    });

    await logActivity({
      userId: user.id,
      userName: user.name,
      module: "SYSTEM",
      event: "EMPLOYEE_UPDATED",
      recordId: id,
      description: `Updated team member profile "${updated.name}" (${updated.jobTitle}).`,
    });

    await logAudit({
      userId: user.id,
      action: "UPDATE",
      entity: "Employee" as any,
      entityId: id,
      oldValues: existing,
      newValues: updated,
    });

    return NextResponse.json({ success: true, employee: updated });
  } catch (err: any) {
    console.error("PUT /api/team/[id] error:", err);
    return NextResponse.json({ error: "Failed to update team member" }, { status: 500 });
  }
}

// DELETE /api/team/[id] - Delete team member
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const existing = await prisma.employee.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Team member not found" }, { status: 404 });
    }

    // Safety: Prevent deleting the primary Founder account if linked
    if (existing.email === "taha@vertexia.pk") {
      return NextResponse.json(
        { error: "The primary Founder record cannot be deleted." },
        { status: 400 }
      );
    }

    // If a user account is linked, unlink employeeId first
    if (existing.user) {
      await prisma.user.update({
        where: { id: existing.user.id },
        data: { employeeId: null },
      });
    }

    await prisma.employee.delete({ where: { id } });

    await logActivity({
      userId: user.id,
      userName: user.name,
      module: "SYSTEM",
      event: "EMPLOYEE_DELETED",
      recordId: id,
      description: `Deleted team member record "${existing.name}" (${existing.employeeCode}).`,
    });

    await logAudit({
      userId: user.id,
      action: "DELETE",
      entity: "Employee" as any,
      entityId: id,
      oldValues: existing,
    });

    return NextResponse.json({ success: true, message: "Team member deleted" });
  } catch (err: any) {
    console.error("DELETE /api/team/[id] error:", err);
    return NextResponse.json({ error: "Failed to delete team member" }, { status: 500 });
  }
}
