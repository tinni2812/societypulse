import { NextResponse } from "next/server";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

export async function GET() {
  try {
    const societies = await prisma.society.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ societies });
  } catch (error) {
    console.error("Society fetch error:", error);

    return NextResponse.json(
      {
        error: "Unable to fetch societies.",
      },
      { status: 500 },
    );
  }
}