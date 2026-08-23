import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";
import { authOptions } from "../../../lib/auth";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 },
      );
    }

    if (session.user.role !== "RESIDENT") {
      return NextResponse.json(
        { error: "Only residents can create complaints." },
        { status: 403 },
      );
    }

    const body = await request.json();

    const title = body.title?.trim();
    const description = body.description?.trim();
    const category = body.category?.trim();
    const locationId = body.locationId;
    const severity = Number(body.severity);
    const affectedResidentsEstimated = Number(
  body.affectedResidentsEstimated ?? 1,
);

    if (!title || !description || !category || !locationId) {
      return NextResponse.json(
        {
          error:
            "Title, description, category, and location are required.",
        },
        { status: 400 },
      );
    }

    if (!Number.isInteger(severity) || severity < 1 || severity > 5) {
      return NextResponse.json(
        {
          error: "Severity must be an integer between 1 and 5.",
        },
        { status: 400 },
      );
    }
    if (
  !Number.isInteger(affectedResidentsEstimated) ||
  affectedResidentsEstimated < 1
) {
  return NextResponse.json(
    {
      error: "Affected residents must be a positive integer.",
    },
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

    if (!resident || resident.role !== "RESIDENT") {
      return NextResponse.json(
        { error: "Resident account not found." },
        { status: 403 },
      );
    }

    const location = await prisma.location.findFirst({
      where: {
        id: locationId,
        societyId: resident.societyId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!location) {
      return NextResponse.json(
        {
          error: "Invalid location for your society.",
        },
        { status: 400 },
      );
    }
       
    const existingGroup = await prisma.complaintGroup.findFirst({
  where: {
    societyId: resident.societyId,
    category,
    locationId: location.id,
    isActive: true,
  },
  orderBy: {
    lastUpdatedAt: "desc",
  },
});
let groupId = existingGroup?.id ?? null;

if (!existingGroup) {
  const newGroup = await prisma.complaintGroup.create({
    data: {
      name: `${category} Issue`,
      category,
      locationId: location.id,
      description: `${category} complaints from ${location.name}`,
      complaintCount: 1,
affectedResidents: affectedResidentsEstimated,
      societyId: resident.societyId,
    },
  });

  groupId = newGroup.id;
}
const priorityScore = Math.min(
  100,
  severity * 20 +
    Math.min(affectedResidentsEstimated * 5, 25),
);

const priorityLabel =
  priorityScore >= 90
    ? "CRITICAL"
    : priorityScore >= 70
      ? "HIGH"
      : priorityScore >= 50
        ? "MEDIUM"
        : "LOW";
        const sla = await prisma.sLA.findFirst({
  where: {
    societyId: resident.societyId,
    OR: [
      {
        category,
        priorityLabel,
      },
      {
        category: null,
        priorityLabel,
      },
      {
        category,
        priorityLabel: null,
      },
      {
        category: null,
        priorityLabel: null,
      },
    ],
  },
  orderBy: [
    {
      category: "desc",
    },
    {
      priorityLabel: "desc",
    },
  ],
  select: {
    id: true,
    resolutionHours: true,
  },
});
const dueAt = sla
  ? new Date(
      Date.now() + sla.resolutionHours * 60 * 60 * 1000,
    )
  : null;
  

    const complaint = await prisma.complaint.create({
  data: {
    title,
    description,
    category,
    severity,

    reporterId: resident.id,
    societyId: resident.societyId,
    locationId: location.id,
    groupId,

    priorityScore,
priorityLabel,

slaId: sla?.id ?? null,
dueAt,

affectedResidentsEstimated,
  },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        severity: true,
        priorityScore: true,
        priorityLabel: true,
        affectedResidentsEstimated: true,
        status: true,
        societyId: true,
        locationId: true,
        createdAt: true,
      },
    });
    if (existingGroup) {
  const newComplaintCount =
    existingGroup.complaintCount + 1;

  await prisma.complaintGroup.update({
    where: {
      id: existingGroup.id,
    },
    data: {
      name:
        newComplaintCount >= 2
          ? `Recurring ${category} Issue`
          : `${category} Issue`,
      description:
        newComplaintCount >= 2
          ? `Recurring ${category} complaints from ${location.name}`
          : `${category} complaints from ${location.name}`,
      complaintCount: {
        increment: 1,
      },
      affectedResidents: {
  increment: affectedResidentsEstimated,
},
    },
  });
}

    return NextResponse.json(
      {
        message: "Complaint created successfully.",
        complaint,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Complaint creation error:", error);

    return NextResponse.json(
      {
        error: "Something went wrong while creating the complaint.",
      },
      { status: 500 },
    );
  }
}