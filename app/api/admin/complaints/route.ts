import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../generated/prisma/client";
import { authOptions } from "../../../../lib/auth";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

export async function GET() {
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
        { error: "Only administrators can access complaints." },
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
        role: true,
      },
    });

    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Administrator account not found." },
        { status: 403 },
      );
    }

    const complaints = await prisma.complaint.findMany({
      where: {
        societyId: admin.societyId,
      },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
            block: true,
            floor: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            complaintCount: true,
            isActive: true,
          },
        },
        satisfactionRating: {
          select: {
            score: true,
            comment: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      complaints,
    });
  } catch (error) {
    console.error("Admin complaint fetch error:", error);

    return NextResponse.json(
      {
        error: "Unable to fetch complaints.",
      },
      { status: 500 },
    );
  }
}