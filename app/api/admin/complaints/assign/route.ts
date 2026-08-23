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
    const assigneeId = body.assigneeId || null;

    if (!complaintId) {
      return NextResponse.json(
        { error: "Complaint ID is required." },
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
        role: true,
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

    if (assigneeId) {
      const assignee = await prisma.user.findFirst({
        where: {
          id: assigneeId,
          societyId: admin.societyId,
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      if (!assignee) {
        return NextResponse.json(
          { error: "Selected user does not belong to this society." },
          { status: 400 },
        );
      }
    }

    const updatedComplaint = await prisma.complaint.update({
      where: {
        id: complaint.id,
      },
      data: {
        assignedToId: assigneeId,
      },
      select: {
        id: true,
        assignedToId: true,
      },
    });

    return NextResponse.json({
      success: true,
      complaint: updatedComplaint,
    });
  } catch (error) {
    console.error("Assignment error:", error);

    return NextResponse.json(
      { error: "Failed to update complaint assignment." },
      { status: 500 },
    );
  }
}