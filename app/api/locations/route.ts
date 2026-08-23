import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "../../../lib/auth";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        societyId: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 },
      );
    }

    const locations = await prisma.location.findMany({
      where: {
        societyId: user.societyId,
      },
      select: {
        id: true,
        name: true,
        block: true,
        floor: true,
      },
      orderBy: [
        {
          block: "asc",
        },
        {
          floor: "asc",
        },
      ],
    });

    return NextResponse.json({ locations });
  } catch (error) {
    console.error("Location fetch error:", error);

    return NextResponse.json(
      { error: "Unable to fetch locations." },
      { status: 500 },
    );
  }
}