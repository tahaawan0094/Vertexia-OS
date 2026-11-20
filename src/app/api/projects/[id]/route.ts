import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    await prisma.taskChecklist.deleteMany({ where: { task: { projectId: id } } });
    await prisma.taskComment.deleteMany({ where: { task: { projectId: id } } });
    await prisma.task.deleteMany({ where: { projectId: id } });
    await prisma.project.delete({ where: { id } });

    await logActivity({
      userId: user.id,
      userName: user.name,
      module: "PROJECT",
      event: "PROJECT_DELETED",
      recordId: id,
      description: `Deleted project: ${existing.name} (${existing.projectCode}).`,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
