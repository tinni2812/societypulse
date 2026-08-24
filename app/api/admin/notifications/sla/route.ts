import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../../generated/prisma/client";
import { authOptions } from "../../../../../lib/auth";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 },
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

    const now = new Date();

    const overdueComplaints = await prisma.complaint.findMany({
      where: {
        societyId: admin.societyId,
        dueAt: {
          lt: now,
        },
        status: {
          notIn: ["RESOLVED", "CLOSED"],
        },
      },
      select: {
        id: true,
        title: true,
        assignedToId: true,
      },
    });

    let created = 0;

    for (const complaint of overdueComplaints) {
      const recipientId = complaint.assignedToId ?? admin.id;

      const existing = await prisma.notification.findFirst({
        where: {
          complaintId: complaint.id,
          recipientId,
          type: "SLA_OVERDUE",
        },
      });

      if (existing) {
        continue;
      }

      await prisma.notification.create({
        data: {
          title: "SLA Overdue",
          message: `Complaint "${complaint.title}" has exceeded its SLA.`,
          type: "SLA_OVERDUE",
          recipientId,
          createdById: admin.id,
          complaintId: complaint.id,
        },
      });

      created++;
    }

    return NextResponse.json({
      success: true,
      created,
    });
  } catch (error) {
    console.error("SLA notification error:", error);

    return NextResponse.json(
      { error: "Failed to create SLA notifications." },
      { status: 500 },
    );
  }
}