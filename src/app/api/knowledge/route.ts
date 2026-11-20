import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const where: any = { isPublished: true };
    if (category && category !== "ALL") where.category = category;

    const articles = await prisma.knowledgeArticle.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ articles });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch articles" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { title, category, content, tags } = await req.json();

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const article = await prisma.knowledgeArticle.create({
      data: {
        title: title.trim(),
        slug: `${slug}-${Date.now().toString().slice(-4)}`,
        category: category || "COMPANY",
        content: content.trim(),
        author: user.name,
        tags,
      },
    });

    return NextResponse.json({ success: true, article });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to create article" }, { status: 500 });
  }
}
