import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface InvoiceData {
  invoiceNumber: string;
  issueDate: string | Date;
  dueDate: string | Date;
  status: string;
  currency: string;
  client: {
    businessName: string;
    contactPerson?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    city?: string | null;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  paidAmount: number;
  notes?: string | null;
  paymentTerms?: string | null;
}

export function generateInvoicePDF(data: InvoiceData): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const primaryColor: [number, number, number] = [15, 23, 42]; // Navy #0F172A
  const accentColor: [number, number, number] = [37, 99, 235]; // Blue #2563EB
  const grayText: [number, number, number] = [100, 116, 139]; // Gray #64748B

  // Header Background Bar
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 36, "F");

  // Company Brand
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("VERTEXIA OS", 14, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text("Vertexia Software Company • Karachi, Pakistan", 14, 25);
  doc.text("contact@vertexia.pk • https://vertexia.pk", 14, 30);

  // Document Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text("INVOICE", 196, 20, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(226, 232, 240);
  doc.text(`#${data.invoiceNumber}`, 196, 28, { align: "right" });

  // Bill To & Invoice Meta
  let y = 48;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...primaryColor);
  doc.text("BILLED TO:", 14, y);
  doc.text("INVOICE DETAILS:", 130, y);

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(data.client.businessName, 14, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...grayText);
  doc.text(`Issue Date: ${new Date(data.issueDate).toLocaleDateString("en-GB")}`, 130, y);

  y += 5;
  if (data.client.contactPerson) {
    doc.text(`Attn: ${data.client.contactPerson}`, 14, y);
  }
  doc.text(`Due Date: ${new Date(data.dueDate).toLocaleDateString("en-GB")}`, 130, y);

  y += 5;
  if (data.client.phone) {
    doc.text(`Phone: ${data.client.phone}`, 14, y);
  }
  doc.text(`Status: ${data.status}`, 130, y);

  y += 5;
  if (data.client.address || data.client.city) {
    doc.text(`${data.client.address || ""}, ${data.client.city || "Karachi"}`, 14, y);
  }
  const balanceDue = Math.max(0, data.totalAmount - data.paidAmount);
  doc.setFont("helvetica", "bold");
  if (balanceDue > 0) {
    doc.setTextColor(220, 38, 38);
  } else {
    doc.setTextColor(22, 163, 74);
  }
  doc.text(`Balance Due: ${data.currency} ${balanceDue.toLocaleString()}`, 130, y);

  // Table Items
  const tableData = data.items.map((item, idx) => [
    (idx + 1).toString(),
    item.description,
    item.quantity.toString(),
    `${data.currency} ${item.unitPrice.toLocaleString()}`,
    `${data.currency} ${item.amount.toLocaleString()}`,
  ]);

  autoTable(doc, {
    startY: y + 10,
    head: [["#", "Description", "Qty", "Unit Price", "Total Amount"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: {
      textColor: [30, 41, 59],
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      1: { cellWidth: 90 },
      2: { cellWidth: 20, halign: "center" },
      3: { cellWidth: 35, halign: "right" },
      4: { cellWidth: 35, halign: "right" },
    },
  });

  // Totals Section
  const finalY = (doc as any).lastAutoTable.finalY + 8;
  const rightColX = 140;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...grayText);
  doc.text("Subtotal:", rightColX, finalY);
  doc.text(`${data.currency} ${data.subtotal.toLocaleString()}`, 196, finalY, { align: "right" });

  let curY = finalY + 5;
  if (data.discount > 0) {
    doc.text("Discount:", rightColX, curY);
    doc.text(`- ${data.currency} ${data.discount.toLocaleString()}`, 196, curY, { align: "right" });
    curY += 5;
  }

  if (data.tax > 0) {
    doc.text("Tax / GST:", rightColX, curY);
    doc.text(`${data.currency} ${data.tax.toLocaleString()}`, 196, curY, { align: "right" });
    curY += 5;
  }

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(rightColX, curY, 196, curY);
  curY += 6;

  // Grand Total
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...primaryColor);
  doc.text("Total Amount:", rightColX, curY);
  doc.text(`${data.currency} ${data.totalAmount.toLocaleString()}`, 196, curY, { align: "right" });

  curY += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(22, 163, 74);
  doc.text("Amount Paid:", rightColX, curY);
  doc.text(`${data.currency} ${data.paidAmount.toLocaleString()}`, 196, curY, { align: "right" });

  curY += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  if (balanceDue > 0) {
    doc.setTextColor(220, 38, 38);
  } else {
    doc.setTextColor(22, 163, 74);
  }
  doc.text("Balance Due:", rightColX, curY);
  doc.text(`${data.currency} ${balanceDue.toLocaleString()}`, 196, curY, { align: "right" });

  // Notes and Terms
  let bottomY = finalY;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...primaryColor);
  doc.text("Payment Terms & Bank Details:", 14, bottomY);
  bottomY += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...grayText);
  doc.text(data.paymentTerms || "Please transfer to official Vertexia account within due date.", 14, bottomY);
  bottomY += 4;
  doc.text("Accepted: Bank Alfalah / Meezan Bank / JazzCash / Easypaisa", 14, bottomY);

  if (data.notes) {
    bottomY += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...primaryColor);
    doc.text("Customer Notes:", 14, bottomY);
    bottomY += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...grayText);
    doc.text(data.notes, 14, bottomY);
  }

  // Footer
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 280, 210, 17, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("Vertexia OS — Confidential Internal Commercial Invoice", 105, 287, { align: "center" });
  doc.text("Generated by Vertexia OS • One Platform. Complete Business Control.", 105, 292, { align: "center" });

  return doc;
}
