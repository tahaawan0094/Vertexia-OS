import { jsPDF } from "jspdf";

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

const formatInvoiceDate = (date: string | Date) => {
  const d = new Date(date);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

export function generateInvoicePDF(data: InvoiceData): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const balanceDue = Math.max(0, data.totalAmount - data.paidAmount);
  const formattedDate = formatInvoiceDate(data.issueDate);

  // Outer thin border box (matching the sheet container)
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.roundedRect(12, 12, 186, 273, 3, 3, "S");

  // Top Title: INVOICE
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text("INVOICE", 20, 27);

  // Arrow Down-Left Icon at Top Right
  doc.setLineWidth(0.7);
  doc.line(183, 20, 175, 28); // diagonal
  doc.line(175, 28, 182, 28); // horizontal head
  doc.line(175, 28, 175, 21); // vertical head

  // Invoice Number: INVOICE NO.06
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  const invoiceNumStr = data.invoiceNumber.startsWith("INV-")
    ? `INVOICE NO.${data.invoiceNumber.replace(/^INV-0*/i, "")}`
    : `INVOICE NO.${data.invoiceNumber}`;
  doc.text(invoiceNumStr, 20, 34);

  // Top Divider Line
  doc.setLineWidth(0.35);
  doc.line(20, 38, 190, 38);

  // ISSUED TO & Issued Date section
  let y = 47;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("ISSUED TO :", 20, y);

  // Issued Date right aligned
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Issued Date   :    ${formattedDate}`, 190, y, { align: "right" });

  y += 5.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  if (data.client.contactPerson) {
    doc.text(data.client.contactPerson, 20, y);
    y += 4.5;
  }
  doc.text(data.client.businessName, 20, y);
  y += 4.5;

  if (data.client.phone) {
    doc.text(data.client.phone, 20, y);
    y += 4.5;
  }
  if (data.client.email) {
    doc.text(data.client.email, 20, y);
    y += 4.5;
  }

  // Table Section Header
  const tableStartY = Math.max(y + 8, 80);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("DESCRIPTION", 20, tableStartY);
  doc.text("PRICE", 190, tableStartY, { align: "right" });

  doc.setLineWidth(0.35);
  doc.line(20, tableStartY + 2.5, 190, tableStartY + 2.5);

  let rowY = tableStartY + 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);

  // Line items if provided
  if (data.items && data.items.length > 0) {
    data.items.forEach((item) => {
      const qtyLabel = item.quantity > 1 ? ` (${item.quantity}x)` : "";
      doc.text(`${item.description}${qtyLabel}`, 20, rowY);
      doc.text(`PKR ${item.amount.toLocaleString()}`, 190, rowY, { align: "right" });
      rowY += 6.5;
    });
  }

  // Summary Rows: Total Amount, Amount Paid, Remaining Balance
  doc.text("Total Amount", 20, rowY);
  doc.text(`PKR ${data.totalAmount.toLocaleString()}`, 190, rowY, { align: "right" });
  rowY += 6.5;

  const paidFormatted =
    data.paidAmount > 0
      ? `PKR ${data.paidAmount.toLocaleString()}`
      : "PKR 00,000";
  doc.text("Amount Paid", 20, rowY);
  doc.text(paidFormatted, 190, rowY, { align: "right" });
  rowY += 6.5;

  const remainingFormatted =
    balanceDue > 0
      ? `PKR ${balanceDue.toLocaleString()}`
      : "PKR 00,000";
  doc.text("Remaining Balance", 20, rowY);
  doc.text(remainingFormatted, 190, rowY, { align: "right" });
  rowY += 10;

  // Divider Line before Total
  doc.setLineWidth(0.35);
  doc.line(20, rowY, 190, rowY);
  rowY += 7;

  // Total summary on right
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text("Total", 145, rowY);
  doc.text(`PKR ${data.totalAmount.toLocaleString()}`, 190, rowY, { align: "right" });

  // Underline under Total
  rowY += 2.5;
  doc.setLineWidth(0.35);
  doc.line(135, rowY, 190, rowY);

  // TERMS & CONDITIONS (Bottom Left)
  const termsY = 240;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("TERMS & CONDITIONS:", 20, termsY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(
    "For our Terms, Conditions, and Service Policies, please visit our official Terms of Services page.",
    20,
    termsY + 4.5
  );
  doc.text("www.vertexiaagency.com/terms-of-services", 20, termsY + 9);

  // Bottom Right: THANK YOU FOR CHOOSING VERTEXIA
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("THANK YOU FOR CHOOSING VERTEXIA", 190, 260, { align: "right" });

  return doc;
}
