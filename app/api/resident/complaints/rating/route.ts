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

    if (session.user.role !== "RESIDENT") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 },
      );
    }

    const body = await request.json();

    const complaintId = body.complaintId;
    const score = Number(body.score);
    const comment =
      typeof body.comment === "string"
        ? body.comment.trim()
        : null;

    if (!complaintId) {
      return NextResponse.json(
        { error: "Complaint ID is required." },
        { status: 400 },
      );
    }

    if (!Number.isInteger(score) || score < 1 || score > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5." },
        { status: 400 },
      );
    }

    const resident = await prisma.user.findUnique({
      where: {
        email: session.user.email!,
      },
      select: {
        id: true,
        societyId: true,
        role: true,
      },
    });

    if (!resident) {
      return NextResponse.json(
        { error: "Resident account not found." },
        { status: 404 },
      );
    }

    const complaint = await prisma.complaint.findFirst({
      where: {
        id: complaintId,
        reporterId: resident.id,
        societyId: resident.societyId,
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

    if (
      complaint.status !== "RESOLVED" &&
      complaint.status !== "CLOSED"
    ) {
      return NextResponse.json(
        {
          error:
            "You can rate a complaint only after it is resolved or closed.",
        },
        { status: 400 },
      );
    }

    const existingRating =
      await prisma.satisfactionRating.findUnique({
        where: {
          complaintId: complaint.id,
        },
        select: {
          id: true,
        },
      });

    if (existingRating) {
      return NextResponse.json(
        { error: "This complaint has already been rated." },
        { status: 400 },
      );
    }

    const rating = await prisma.satisfactionRating.create({
      data: {
        score,
        comment: comment || null,
        complaintId: complaint.id,
        residentId: resident.id,
      },
      select: {
        id: true,
        score: true,
        comment: true,
      },
    });

    return NextResponse.json({
      success: true,
      rating,
    });
  } catch (error) {
    console.error("Rating error:", error);

    return NextResponse.json(
      { error: "Failed to submit rating." },
      { status: 500 },
    );
  }
}