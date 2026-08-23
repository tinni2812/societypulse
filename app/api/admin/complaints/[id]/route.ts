import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  PriorityLabel,
} from "../../../../generated/prisma/client";
import { authOptions } from "../../../../../lib/auth";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
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
        societyId: true,
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
        id,
        societyId: admin.societyId,
      },
      select: {
  id: true,
  groupId: true,
  affectedResidentsEstimated: true,
affectedResidentsVerified: true,
},
    });

    if (!complaint) {
      return NextResponse.json(
        { error: "Complaint not found." },
        { status: 404 },
      );
    }

    const formData = await request.formData();

    const title = formData.get("title");
    const description = formData.get("description");
    const category = formData.get("category");
    const severity = formData.get("severity");
    const priorityLabel = formData.get("priorityLabel");
    const affectedResidentsEstimated = formData.get(
      "affectedResidentsEstimated",
    );
    const affectedResidentsVerified = formData.get(
  "affectedResidentsVerified",
);

    if (
      typeof title !== "string" ||
      !title.trim()
    ) {
      return NextResponse.json(
        { error: "Title is required." },
        { status: 400 },
      );
    }

    if (
      typeof description !== "string" ||
      !description.trim()
    ) {
      return NextResponse.json(
        { error: "Description is required." },
        { status: 400 },
      );
    }

    if (
      typeof category !== "string" ||
      !category.trim()
    ) {
      return NextResponse.json(
        { error: "Category is required." },
        { status: 400 },
      );
    }

    const severityNumber = Number(severity);

    if (
      !Number.isInteger(severityNumber) ||
      severityNumber < 1 ||
      severityNumber > 5
    ) {
      return NextResponse.json(
        { error: "Severity must be between 1 and 5." },
        { status: 400 },
      );
    }

    const validPriorities = [
      "LOW",
      "MEDIUM",
      "HIGH",
      "CRITICAL",
    ];

    if (
      typeof priorityLabel !== "string" ||
      !validPriorities.includes(priorityLabel)
    ) {
      return NextResponse.json(
        { error: "Invalid priority." },
        { status: 400 },
      );
    }

    const affectedResidentsNumber = Number(
      affectedResidentsEstimated,
    );
    const affectedResidentsVerifiedNumber =
  affectedResidentsVerified === ""
    ? null
    : Number(affectedResidentsVerified);

    if (
      !Number.isInteger(affectedResidentsNumber) ||
      affectedResidentsNumber < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Affected residents must be a non-negative number.",
        },
        { status: 400 },
      );
    }
    if (
  affectedResidentsVerifiedNumber !== null &&
  (!Number.isInteger(affectedResidentsVerifiedNumber) ||
    affectedResidentsVerifiedNumber < 0)
) {
  return NextResponse.json(
    {
      error:
        "Verified affected residents must be a non-negative number.",
    },
    { status: 400 },
  );
}
const priorityScore = Math.min(
  100,
  severityNumber * 20 +
    Math.min(affectedResidentsNumber * 5, 25),
);

const priorityLabelCalculated =
  priorityScore >= 90
    ? "CRITICAL"
    : priorityScore >= 70
      ? "HIGH"
      : priorityScore >= 50
        ? "MEDIUM"
        : "LOW";

    const updatedComplaint =
      await prisma.complaint.update({
        where: {
          id: complaint.id,
        },
        data: {
          title: title.trim(),
          description: description.trim(),
          category: category.trim(),
          severity: severityNumber,
priorityScore,
priorityLabel: priorityLabelCalculated,
affectedResidentsEstimated:
  affectedResidentsNumber,

affectedResidentsVerified:
  affectedResidentsVerifiedNumber,
        },
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          severity: true,
          priorityLabel: true,
          affectedResidentsEstimated: true,
affectedResidentsVerified: true,
        },
      });
      if (complaint.groupId) {
  const groupComplaints = await prisma.complaint.findMany({
    where: {
      groupId: complaint.groupId,
    },
    select: {
      affectedResidentsEstimated: true,
affectedResidentsVerified: true,
    },
  });

  const totalAffectedResidents =
    groupComplaints.reduce(
      (total, item) =>
        total + item.affectedResidentsEstimated,
      0,
    );

  await prisma.complaintGroup.update({
    where: {
      id: complaint.groupId,
    },
    data: {
      affectedResidents: totalAffectedResidents,
    },
  });
}

    return NextResponse.redirect(
  new URL(`/admin/complaints/${complaint.id}`, request.url),
);
  } catch (error) {
    console.error(
      "Complaint update error:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to update complaint." },
      { status: 500 },
    );
  }
}