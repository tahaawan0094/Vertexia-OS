import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";

    if (!q || q.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const [leads, clients, invoices, products, installations, tasks, tickets] = await Promise.all([
      // Leads
      prisma.lead.findMany({
        where: {
          OR: [
            { businessName: { contains: q } },
            { contactPerson: { contains: q } },
            { phone: { contains: q } },
            { email: { contains: q } },
            { leadCode: { contains: q } },
          ],
        },
        take: 5,
        select: { id: true, leadCode: true, businessName: true, status: true, contactPerson: true },
      }),
      // Clients
      prisma.client.findMany({
        where: {
          OR: [
            { businessName: { contains: q } },
            { contactPerson: { contains: q } },
            { phone: { contains: q } },
            { email: { contains: q } },
            { clientCode: { contains: q } },
          ],
        },
        take: 5,
        select: { id: true, clientCode: true, businessName: true, status: true, contactPerson: true },
      }),
      // Invoices
      prisma.invoice.findMany({
        where: {
          OR: [
            { invoiceNumber: { contains: q } },
            { client: { businessName: { contains: q } } },
          ],
        },
        take: 5,
        include: { client: { select: { businessName: true } } },
      }),
      // Products
      prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { productCode: { contains: q } },
          ],
        },
        take: 4,
        select: { id: true, name: true, productCode: true, status: true },
      }),
      // Installations
      prisma.installation.findMany({
        where: {
          OR: [
            { installCode: { contains: q } },
            { client: { businessName: { contains: q } } },
            { license: { licenseKey: { contains: q } } },
          ],
        },
        take: 5,
        include: {
          client: { select: { businessName: true } },
          product: { select: { name: true } },
        },
      }),
      // Tasks
      prisma.task.findMany({
        where: {
          OR: [
            { title: { contains: q } },
            { taskCode: { contains: q } },
          ],
        },
        take: 5,
        select: { id: true, taskCode: true, title: true, status: true, priority: true },
      }),
      // Tickets
      prisma.ticket.findMany({
        where: {
          OR: [
            { ticketCode: { contains: q } },
            { title: { contains: q } },
            { client: { businessName: { contains: q } } },
          ],
        },
        take: 5,
        include: { client: { select: { businessName: true } } },
      }),
    ]);

    const results = [
      ...leads.map((l) => ({
        id: l.id,
        type: "Lead",
        title: `${l.leadCode} — ${l.businessName}`,
        subtitle: `Status: ${l.status} • Contact: ${l.contactPerson || "N/A"}`,
        url: `/crm/leads/${l.id}`,
      })),
      ...clients.map((c) => ({
        id: c.id,
        type: "Client",
        title: `${c.clientCode} — ${c.businessName}`,
        subtitle: `Status: ${c.status} • Contact: ${c.contactPerson}`,
        url: `/clients/${c.id}`,
      })),
      ...invoices.map((inv) => ({
        id: inv.id,
        type: "Invoice",
        title: `${inv.invoiceNumber} — ${inv.client.businessName}`,
        subtitle: `Total: ${inv.currency} ${inv.totalAmount.toLocaleString()} • Status: ${inv.status}`,
        url: `/finance/invoices/${inv.id}`,
      })),
      ...products.map((p) => ({
        id: p.id,
        type: "Product",
        title: `${p.productCode} — ${p.name}`,
        subtitle: `Status: ${p.status}`,
        url: `/products/${p.id}`,
      })),
      ...installations.map((ins) => ({
        id: ins.id,
        type: "Installation",
        title: `${ins.installCode} — ${ins.client.businessName}`,
        subtitle: `${ins.product.name} • Status: ${ins.status}`,
        url: `/installations/${ins.id}`,
      })),
      ...tasks.map((t) => ({
        id: t.id,
        type: "Task",
        title: `${t.taskCode} — ${t.title}`,
        subtitle: `Status: ${t.status} • Priority: ${t.priority}`,
        url: `/projects`,
      })),
      ...tickets.map((t) => ({
        id: t.id,
        type: "Ticket",
        title: `${t.ticketCode} — ${t.title}`,
        subtitle: `Client: ${t.client.businessName} • Priority: ${t.priority}`,
        url: `/support/${t.id}`,
      })),
    ];

    return NextResponse.json({ results });
  } catch (err: any) {
    console.error("Search API error:", err);
    return NextResponse.json({ error: "Failed to search" }, { status: 500 });
  }
}
