"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LifeBuoy,
  MessageSquare,
  ShieldAlert,
  CheckCircle2,
  Clock,
  User,
  ArrowRight,
  ExternalLink,
  Send,
  Building2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge, PriorityBadge } from "@/components/ui/badge";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { formatDate, formatDateTime } from "@/lib/utils";

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Message form
  const [message, setMessage] = useState("");
  const [isInternal, setIsInternal] = useState(true);
  const [sendingMsg, setSendingMsg] = useState(false);

  // Status & Resolution Modal
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [resolving, setResolving] = useState(false);

  const fetchTicket = async () => {
    try {
      const res = await fetch(`/api/support/${id}`);
      if (!res.ok) {
        router.push("/support");
        return;
      }
      const data = await res.json();
      setTicket(data.ticket);
    } catch (err) {
      console.error("Failed to load ticket:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchTicket();
  }, [id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSendingMsg(true);

    try {
      const res = await fetch(`/api/support/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, isInternal }),
      });
      if (res.ok) {
        setMessage("");
        fetchTicket();
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSendingMsg(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    try {
      const res = await fetch(`/api/support/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) fetchTicket();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleResolveTicket = async () => {
    setResolving(true);
    try {
      const res = await fetch(`/api/support/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "RESOLVED",
          resolutionNotes,
        }),
      });
      if (res.ok) {
        setResolveModalOpen(false);
        fetchTicket();
      }
    } catch (err) {
      console.error("Failed to resolve ticket:", err);
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-xs text-slate-400">Loading support conversation...</div>;
  }

  if (!ticket) return null;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/support"
          className="text-xs font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1"
        >
          ← Back to Support Helpdesk
        </Link>
      </div>

      {/* Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              {ticket.ticketCode}
            </span>
            <h1 className="text-xl font-bold font-heading text-slate-900 tracking-tight">
              {ticket.title}
            </h1>
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>
          <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3 mt-2">
            <span>Client: <strong className="text-slate-800">{ticket.client.businessName}</strong></span>
            <span>•</span>
            <span>Product: <strong className="text-blue-600">{ticket.product?.name || "General"}</strong></span>
            <span>•</span>
            <span>Opened on {formatDateTime(ticket.createdAt)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {ticket.status !== "RESOLVED" && ticket.status !== "CLOSED" && (
            <Button size="sm" onClick={() => setResolveModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              <span>Resolve Ticket</span>
            </Button>
          )}

          <select
            value={ticket.status}
            onChange={(e) => handleUpdateStatus(e.target.value)}
            className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-slate-50 font-semibold text-slate-700"
          >
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="WAITING_FOR_CLIENT">Waiting for Client</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Client & Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Client Business</span>
                <Link href={`/clients/${ticket.client.id}`} className="font-bold text-blue-600 hover:underline">
                  {ticket.client.businessName} →
                </Link>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Phone</span>
                <span className="font-mono text-slate-800">{ticket.client.phone}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Category</span>
                <span className="font-semibold text-slate-800">{ticket.category}</span>
              </div>
              {ticket.resolutionNotes && (
                <div className="pt-2 border-t border-slate-100 p-2.5 rounded bg-emerald-50 text-emerald-800">
                  <span className="font-bold text-[10px] uppercase block mb-1">Resolution Summary</span>
                  {ticket.resolutionNotes}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Conversation & Internal Notes */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Ticket Conversation & Internal Log</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Internal notes are private to Vertexia team.
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Issue Description Bubble */}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Original Issue Statement</span>
                <p className="leading-relaxed">{ticket.description}</p>
              </div>

              {/* Message Thread */}
              <div className="space-y-3 pt-2">
                {ticket.messages?.map((msg: any) => (
                  <div
                    key={msg.id}
                    className={`p-3.5 rounded-lg border text-xs space-y-1 ${
                      msg.isInternal
                        ? "bg-amber-50/40 border-amber-200"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {msg.isInternal ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> Internal Note
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-800">
                            Client Message
                          </span>
                        )}
                        <strong className="text-slate-800">{msg.sender}</strong>
                      </div>
                      <span className="text-[10px] text-slate-400">{formatDateTime(msg.createdAt)}</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed pl-1">{msg.message}</p>
                  </div>
                ))}
              </div>

              {/* Post Message Form */}
              <form onSubmit={handleSendMessage} className="pt-4 border-t border-slate-100 space-y-3">
                <Textarea
                  placeholder="Enter technician update, internal troubleshooting step, or note..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={2}
                />

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>Mark as internal team note</span>
                  </label>

                  <Button type="submit" size="sm" isLoading={sendingMsg}>
                    <Send className="w-3.5 h-3.5 mr-1" />
                    <span>Post Update</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Resolve Modal */}
      <Modal
        isOpen={resolveModalOpen}
        onClose={() => setResolveModalOpen(false)}
        title="Resolve Support Ticket"
        description="Record resolution notes for future knowledge base reference."
      >
        <div className="space-y-4">
          <Textarea
            label="Resolution Summary"
            required
            placeholder="e.g. Reconfigured thermal printer USB baud rate to 9600 and replaced paper roll..."
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" onClick={() => setResolveModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleResolveTicket} isLoading={resolving} className="bg-emerald-600 text-white">
              Confirm Resolution
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
