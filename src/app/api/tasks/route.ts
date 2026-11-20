import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");

    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (status && status !== "ALL") where.status = status;

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        project: { select: { id: true, projectCode: true, name: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ tasks });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { title, description, projectId, assignedToId, priority = "MEDIUM", deadline } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Task title is required" }, { status: 400 });
    }

    const count = await prisma.task.count();
    const taskCode = `TSK-${1001 + count}`;

    const task = await prisma.task.create({
      data: {
        taskCode,
        title: title.trim(),
        description,
        projectId: projectId || null,
        assignedToId: assignedToId || null,
        createdById: user.id,
        priority,
        status: "TODO",
        deadline: deadline ? new Date(deadline) : null,
      },
      include: { project: true, assignedTo: true },
    });

    await logActivity({
      userId: user.id,
      userName: user.name,
      module: "TASK",
      event: "TASK_CREATED",
      recordId: task.id,
      description: `Created task ${task.taskCode}: "${task.title}".`,
    });

    return NextResponse.json({ success: true, task });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, status, assignedToId } = await req.json();

    const data: any = {};
    if (status) data.status = status;
    if (assignedToId !== undefined) data.assignedToId = assignedToId;

    const updated = await prisma.task.update({
      where: { id },
      data,
      include: { project: true, assignedTo: true },
    });

    if (status === "DONE") {
      await logActivity({
        userId: user.id,
        userName: user.name,
        module: "TASK",
        event: "TASK_COMPLETED",
        recordId: id,
        description: `Completed task ${updated.taskCode} ("${updated.title}").`,
      });
    }

    return NextResponse.json({ success: true, task: updated });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}
