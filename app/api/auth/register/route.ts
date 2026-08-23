import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    const societyId = body.societyId;

    if (!name || !email || !password || !societyId) {
      return NextResponse.json(
        {
          error: "Name, email, password, and society are required.",
        },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          error: "Password must be at least 8 characters.",
        },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error: "An account with this email already exists.",
        },
        { status: 409 },
      );
    }

    const society = await prisma.society.findUnique({
      where: {
        id: societyId,
      },
    });

    if (!society) {
      return NextResponse.json(
        {
          error: "Selected society does not exist.",
        },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "RESIDENT",
        societyId: society.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        societyId: true,
      },
    });

    return NextResponse.json(
      {
        message: "Registration successful.",
        user,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error:", error);

    return NextResponse.json(
      {
        error: "Something went wrong during registration.",
      },
      { status: 500 },
    );
  }
}