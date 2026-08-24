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

    const { id } = await params;

    const admin = await prisma.user.findUnique({
      where: {
        email: session.user.email!,
      },
      select: {
        id: true,
      },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Admin account not found." },
        { status: 404 },
      );
    }

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        recipientId: admin.id,
      },
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found." },
        { status: 404 },
      );
    }

    const updatedNotification =
      await prisma.notification.update({
        where: {
          id: notification.id,
        },
        data: {
          isRead: true,
        },
      });

    return NextResponse.json({
      success: true,
      notification: updatedNotification,
    });
  } catch (error) {
    console.error("Mark notification as read error:", error);

    return NextResponse.json(
      { error: "Failed to mark notification as read." },
      { status: 500 },
    );
  }
}