import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../../generated/prisma/client";
import { authOptions } from "../../../../../lib/auth";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 },
      );
    }

    const body = await request.json();

    const complaintId = body.complaintId;
    const content =
      typeof body.content === "string"
        ? body.content.trim()
        : "";

    if (!complaintId) {
      return NextResponse.json(
        { error: "Complaint ID is required." },
        { status: 400 },
      );
    }

    if (!content) {
      return NextResponse.json(
        { error: "Comment cannot be empty." },
        { status: 400 },
      );
    }

    const admin = await prisma.user.findUnique({
      where: {
        email: session.user.email!,
      },
      select: {
        id: true,
        societyId: true,
      },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Admin account not found." },
        { status: 404 },
      );
    }

    const complaint = await prisma.complaint.findFirst({
      where: {
        id: complaintId,
        societyId: admin.societyId,
      },
      select: {
        id: true,
      },
    });

    if (!complaint) {
      return NextResponse.json(
        { error: "Complaint not found." },
        { status: 404 },
      );
    }

    const comment = await prisma.complaintComment.create({
      data: {
        content,
        complaintId: complaint.id,
        authorId: admin.id,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      comment,
    });
  } catch (error) {
    console.error("Comment error:", error);

    return NextResponse.json(
      { error: "Failed to add comment." },
      { status: 500 },
    );
  }
}