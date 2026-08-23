import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  NoticeType,
} from "../../../generated/prisma/client";
import { authOptions } from "../../../../lib/auth";

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

console.log("NOTICE FORM DATA:", body);

    const title =
      typeof body.title === "string"
        ? body.title.trim()
        : "";

    const content =
      typeof body.content === "string"
        ? body.content.trim()
        : "";

    const type =
      typeof body.type === "string"
        ? body.type
        : "GENERAL";

    const isImportant =
      typeof body.isImportant === "boolean"
        ? body.isImportant
        : false;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required." },
        { status: 400 },
      );
    }

    if (!content) {
      return NextResponse.json(
        { error: "Content is required." },
        { status: 400 },
      );
    }

    const validTypes = [
      "GENERAL",
      "MAINTENANCE",
      "EMERGENCY",
      "EVENT",
    ];

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid notice type." },
        { status: 400 },
      );
    }
    const noticeType = type as NoticeType;

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

    const notice = await prisma.notice.create({
      data: {
        title,
        content,
        type: noticeType,
        isImportant,
        societyId: admin.societyId,
        authorId: admin.id,
      },
      select: {
        id: true,
        title: true,
        content: true,
        type: true,
        isImportant: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        notice,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Notice creation error:", error);

    return NextResponse.json(
      { error: "Failed to create notice." },
      { status: 500 },
    );
  }
}
export async function GET() {
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

    const admin = await prisma.user.findUnique({
      where: {
        email: session.user.email!,
      },
      select: {
        societyId: true,
      },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Admin account not found." },
        { status: 404 },
      );
    }

    const notices = await prisma.notice.findMany({
      where: {
        societyId: admin.societyId,
      },
      select: {
        id: true,
        title: true,
        content: true,
        type: true,
        isImportant: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      notices,
    });
  } catch (error) {
    console.error("Notice fetch error:", error);

    return NextResponse.json(
      { error: "Failed to fetch notices." },
      { status: 500 },
    );
  }
}
export async function DELETE(request: Request) {
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

    const { id } = await request.json();

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Notice ID is required." },
        { status: 400 },
      );
    }

    const admin = await prisma.user.findUnique({
      where: {
        email: session.user.email!,
      },
      select: {
        societyId: true,
      },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Admin account not found." },
        { status: 404 },
      );
    }

    const notice = await prisma.notice.findFirst({
      where: {
        id,
        societyId: admin.societyId,
      },
      select: {
        id: true,
      },
    });

    if (!notice) {
      return NextResponse.json(
        { error: "Notice not found." },
        { status: 404 },
      );
    }

    await prisma.notice.delete({
      where: {
        id: notice.id,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Notice deletion error:", error);

    return NextResponse.json(
      { error: "Failed to delete notice." },
      { status: 500 },
    );
  }
}
export async function PUT(request: Request) {
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

    const id =
      typeof body.id === "string"
        ? body.id
        : "";

    const title =
      typeof body.title === "string"
        ? body.title.trim()
        : "";

    const content =
      typeof body.content === "string"
        ? body.content.trim()
        : "";

    const type =
      typeof body.type === "string"
        ? body.type
        : "GENERAL";

    const isImportant =
      typeof body.isImportant === "boolean"
        ? body.isImportant
        : false;

    if (!id) {
      return NextResponse.json(
        { error: "Notice ID is required." },
        { status: 400 },
      );
    }

    if (!title) {
      return NextResponse.json(
        { error: "Title is required." },
        { status: 400 },
      );
    }

    if (!content) {
      return NextResponse.json(
        { error: "Content is required." },
        { status: 400 },
      );
    }

    const validTypes = [
      "GENERAL",
      "MAINTENANCE",
      "EMERGENCY",
      "EVENT",
    ];

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid notice type." },
        { status: 400 },
      );
    }

    const noticeType = type as NoticeType;

    const admin = await prisma.user.findUnique({
      where: {
        email: session.user.email!,
      },
      select: {
        societyId: true,
      },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Admin account not found." },
        { status: 404 },
      );
    }

    const notice = await prisma.notice.findFirst({
      where: {
        id,
        societyId: admin.societyId,
      },
      select: {
        id: true,
      },
    });

    if (!notice) {
      return NextResponse.json(
        { error: "Notice not found." },
        { status: 404 },
      );
    }

    const updatedNotice =
      await prisma.notice.update({
        where: {
          id: notice.id,
        },
        data: {
          title,
          content,
          type: noticeType,
          isImportant,
        },
        select: {
          id: true,
          title: true,
          content: true,
          type: true,
          isImportant: true,
          createdAt: true,
          updatedAt: true,
        },
      });

    return NextResponse.json({
      success: true,
      notice: updatedNotice,
    });
  } catch (error) {
    console.error(
      "Notice update error:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to update notice." },
      { status: 500 },
    );
  }
}