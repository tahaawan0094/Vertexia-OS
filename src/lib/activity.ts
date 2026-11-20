import prisma from "./prisma";

interface LogActivityParams {
  userId?: string | null;
  userName?: string;
  module: "LEAD" | "CLIENT" | "DEAL" | "INVOICE" | "PAYMENT" | "INSTALLATION" | "TICKET" | "PROJECT" | "TASK" | "SYSTEM";
  event: string;
  recordId?: string | null;
  leadId?: string | null;
  clientId?: string | null;
  description: string;
}

export async function logActivity({
  userId,
  userName = "System",
  module,
  event,
  recordId,
  leadId,
  clientId,
  description,
}: LogActivityParams) {
  try {
    return await prisma.activity.create({
      data: {
        userId,
        userName,
        module,
        event,
        recordId,
        leadId,
        clientId,
        description,
      },
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
    return null;
  }
}
