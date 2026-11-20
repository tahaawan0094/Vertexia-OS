import prisma from "./prisma";

interface LogAuditParams {
  userId?: string | null;
  action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "EXPORT" | "PAYMENT_REVERSAL" | "LEAD_CONVERSION";
  entity: "Lead" | "Client" | "Invoice" | "Payment" | "Installation" | "License" | "Ticket" | "Project" | "Task" | "User" | "Setting";
  entityId?: string | null;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function logAudit({
  userId,
  action,
  entity,
  entityId,
  oldValues,
  newValues,
  ipAddress,
  userAgent,
}: LogAuditParams) {
  try {
    return await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        oldValues: oldValues ? JSON.stringify(oldValues) : null,
        newValues: newValues ? JSON.stringify(newValues) : null,
        ipAddress,
        userAgent,
      },
    });
  } catch (err) {
    console.error("Failed to write audit log:", err);
    return null;
  }
}
