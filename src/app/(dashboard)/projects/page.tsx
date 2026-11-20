"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FolderKanban,
  Plus,
  CheckSquare,
  Clock,
  Calendar,
  Layers,
  LayoutList,
  Kanban,
  Users,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge, PriorityBadge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";

const TASK_STAGES = [
  { id: "TODO", label: "To Do", color: "border-slate-400 bg-slate-50" },
  { id: "IN_PROGRESS", label: "In Progress", color: "border-blue-500 bg-blue-50/20" },
  { id: "REVIEW", label: "Under Review", color: "border-purple-500 bg-purple-50/20" },
  { id: "DONE", label: "Completed", color: "border-emerald-500 bg-emerald-50/20" },
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<"projects" | "tasks">("projects");

  // Project Modal State
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectForm, setProjectForm] = useState({
    name: "",
    type: "INTERNAL",
    productId: "",
    description: "",
    managerName: "Taha Awan",
    priority: "MEDIUM",
    deadline: "",
  });

  // Task Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    projectId: "",
    assignedToId: "",
    priority: "MEDIUM",
    deadline: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projRes, taskRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/tasks"),
      ]);

      if (projRes.ok) {
        const pData = await projRes.json();
        setProjects(pData.projects || []);
        setProducts(pData.products || []);
        setUsers(pData.users || []);
        if (pData.projects?.length > 0 && !taskForm.projectId) {
          setTaskForm((prev) => ({ ...prev, projectId: pData.projects[0].id }));
        }
      }

      if (taskRes.ok) {
        const tData = await taskRes.json();
        setTasks(tData.tasks || []);
      }
    } catch (err) {
      console.error("Failed to load projects/tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectForm),
      });
      if (res.ok) {
        setIsProjectModalOpen(false);
        fetchData();
      }
    } catch (err) {
      console.error("Failed to create project:", err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskForm),
      });
      if (res.ok) {
        setIsTaskModalOpen(false);
        setTaskForm({
          title: "",
          description: "",
          projectId: projects[0]?.id || "",
          assignedToId: "",
          priority: "MEDIUM",
          deadline: "",
        });
        fetchData();
      }
    } catch (err) {
      console.error("Failed to create task:", err);
    }
  };

  const handleTaskStageChange = async (taskId: string, newStage: string) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, status: newStage }),
      });
      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: newStage } : t))
        );
      }
    } catch (err) {
      console.error("Failed to update task stage:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 tracking-tight flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-blue-600" />
            Projects & Workload Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Internal product development roadmap and client implementation sprints.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setActiveView("projects")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-colors ${
                activeView === "projects"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Projects</span>
            </button>
            <button
              onClick={() => setActiveView("tasks")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-colors ${
                activeView === "tasks"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Task Board</span>
            </button>
          </div>

          <Button size="sm" variant="outline" onClick={() => setIsTaskModalOpen(true)}>
            <CheckSquare className="w-3.5 h-3.5" />
            <span>New Task</span>
          </Button>

          <Button size="sm" onClick={() => setIsProjectModalOpen(true)}>
            <Plus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </Button>
        </div>
      </div>

      {/* Projects Overview */}
      {activeView === "projects" && (
        <div className="space-y-6">
          {loading ? (
            <div className="py-20 text-center text-xs text-slate-400">Loading company projects...</div>
          ) : projects.length === 0 ? (
            <EmptyState
              title="No Projects Recorded"
              description="Create an internal product sprint or client installation project."
              actionLabel="Create Project"
              onAction={() => setIsProjectModalOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map((project) => (
                <Card key={project.id} className="p-5 flex flex-col justify-between hover:border-blue-300 transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {project.projectCode}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          project.type === "INTERNAL" ? "bg-indigo-50 text-indigo-700" : "bg-emerald-50 text-emerald-700"
                        }`}>
                          {project.type}
                        </span>
                        <StatusBadge status={project.status} />
                      </div>
                    </div>

                    <h3 className="font-heading font-bold text-base text-slate-900 mt-1">
                      {project.name}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-2">
                      {project.description || "No project overview provided."}
                    </p>

                    {/* Progress Bar */}
                    <div className="mt-4 space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-500 font-semibold">
                        <span>Sprint Completion</span>
                        <span>{project.progress}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-3">
                      <span>Tasks: <strong className="text-slate-800">{project.tasks?.length || 0}</strong></span>
                      <span>•</span>
                      <span>Lead: <strong className="text-slate-800">{project.managerName || "Founder"}</strong></span>
                    </div>

                    {project.deadline && (
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Calendar className="w-3 h-3" />
                        {formatDate(project.deadline)}
                      </span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tasks Kanban Board */}
      {activeView === "tasks" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 overflow-x-auto pb-6">
          {TASK_STAGES.map((stage) => {
            const stageTasks = tasks.filter((t) => t.status === stage.id);
            return (
              <div
                key={stage.id}
                className="bg-slate-100/70 rounded-xl border border-slate-200/90 flex flex-col min-w-[260px]"
              >
                {/* Stage Header */}
                <div className={`p-3.5 border-b border-slate-200 border-t-4 rounded-t-xl bg-white ${stage.color}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-bold text-xs text-slate-800">
                      {stage.label}
                    </span>
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-600">
                      {stageTasks.length}
                    </span>
                  </div>
                </div>

                {/* Cards Container */}
                <div className="p-2 space-y-2.5 flex-1 min-h-[400px]">
                  {stageTasks.length === 0 ? (
                    <div className="py-8 text-center text-[11px] text-slate-400">
                      No tasks in this lane
                    </div>
                  ) : (
                    stageTasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-3.5 bg-white rounded-lg border border-slate-200 shadow-sm hover:border-blue-400 transition-all space-y-2 group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-bold text-slate-400">
                            {task.taskCode}
                          </span>
                          <PriorityBadge priority={task.priority} />
                        </div>

                        <h4 className="font-heading font-semibold text-xs text-slate-900 group-hover:text-blue-600 leading-snug">
                          {task.title}
                        </h4>

                        {task.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                          <span className="truncate max-w-[120px]">
                            {task.assignedTo?.name || "Unassigned"}
                          </span>

                          {/* Quick stage switch */}
                          <select
                            value={task.status}
                            onChange={(e) => handleTaskStageChange(task.id, e.target.value)}
                            className="text-[10px] py-0.5 px-1 rounded border border-slate-200 bg-slate-50 text-slate-600 font-semibold"
                          >
                            <option value="TODO">To Do</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="REVIEW">Review</option>
                            <option value="DONE">Done</option>
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        title="Create New Project"
        description="Launch an internal product release sprint or client deployment project."
        maxWidth="md"
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <Input
            label="Project Name"
            required
            placeholder="e.g. Pharmacy Mobile App v2 Sync"
            value={projectForm.name}
            onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Project Category"
              value={projectForm.type}
              onChange={(e) => setProjectForm({ ...projectForm, type: e.target.value })}
            >
              <option value="INTERNAL">Internal Development</option>
              <option value="CLIENT">Client Project</option>
            </Select>

            <Select
              label="Linked Product"
              value={projectForm.productId}
              onChange={(e) => setProjectForm({ ...projectForm, productId: e.target.value })}
            >
              <option value="">None / General</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Priority"
              value={projectForm.priority}
              onChange={(e) => setProjectForm({ ...projectForm, priority: e.target.value })}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </Select>

            <Input
              label="Target Deadline"
              type="date"
              value={projectForm.deadline}
              onChange={(e) => setProjectForm({ ...projectForm, deadline: e.target.value })}
            />
          </div>

          <Textarea
            label="Description & Scope"
            placeholder="Deliverables, target release notes..."
            value={projectForm.description}
            onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsProjectModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Project</Button>
          </div>
        </form>
      </Modal>

      {/* Create Task Modal */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Add Work Task"
        description="Assign a discrete technical or operational task to a team member."
        maxWidth="md"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <Input
            label="Task Title"
            required
            placeholder="e.g. Implement receipt thermal ESC/POS driver"
            value={taskForm.title}
            onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
          />

          <Select
            label="Project"
            value={taskForm.projectId}
            onChange={(e) => setTaskForm({ ...taskForm, projectId: e.target.value })}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.projectCode} — {p.name}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Assign To"
              value={taskForm.assignedToId}
              onChange={(e) => setTaskForm({ ...taskForm, assignedToId: e.target.value })}
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role?.name || "Team"})
                </option>
              ))}
            </Select>

            <Select
              label="Priority"
              value={taskForm.priority}
              onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </Select>
          </div>

          <Textarea
            label="Task Description"
            placeholder="Steps to reproduce, technical specification..."
            value={taskForm.description}
            onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsTaskModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Task</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
