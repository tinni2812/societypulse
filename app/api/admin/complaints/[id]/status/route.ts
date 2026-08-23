import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../../../generated/prisma/client";
import { authOptions } from "../../../../../../lib/auth";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 },
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only administrators can change complaint status." },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body = await request.json();

    const status = body.status;
    const note = body.note?.trim() || null;

    const validStatuses = [
      "OPEN",
      "IN_PROGRESS",
      "RESOLVED",
      "CLOSED",
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error:
            "Invalid status. Use OPEN, IN_PROGRESS, RESOLVED, or CLOSED.",
        },
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

    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Administrator account not found." },
        { status: 403 },
      );
    }

    const complaint = await prisma.complaint.findFirst({
      where: {
        id,
        societyId: admin.societyId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!complaint) {
      return NextResponse.json(
        { error: "Complaint not found." },
        { status: 404 },
      );
    }

    if (complaint.status === status) {
      return NextResponse.json(
        {
          error: `Complaint is already ${status}.`,
        },
        { status: 400 },
      );
    }

    const now = new Date();

    const updatedComplaint = await prisma.$transaction(async (tx) => {
      const updateData: {
        status: typeof status;
        resolvedAt?: Date | null;
        closedAt?: Date | null;
      } = {
        status,
      };

      if (status === "RESOLVED") {
        updateData.resolvedAt = now;
      }

      if (status === "CLOSED") {
        updateData.closedAt = now;

        if (complaint.status !== "RESOLVED") {
          updateData.resolvedAt = now;
        }
      }

      const updated = await tx.complaint.update({
        where: {
          id: complaint.id,
        },
        data: updateData,
        select: {
          id: true,
          title: true,
          status: true,
          resolvedAt: true,
          closedAt: true,
          updatedAt: true,
        },
      });

      await tx.complaintStatusHistory.create({
        data: {
          status,
          note,
          complaintId: complaint.id,
          changedById: admin.id,
        },
      });

      return updated;
    });

    return NextResponse.json({
      message: "Complaint status updated successfully.",
      complaint: updatedComplaint,
    });
  } catch (error) {
    console.error("Complaint status update error:", error);

    return NextResponse.json(
      {
        error: "Something went wrong while updating complaint status.",
      },
      { status: 500 },
    );
  }
}