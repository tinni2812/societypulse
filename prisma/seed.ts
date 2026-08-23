import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting SocietyPulse seed...");

  // --------------------------------------------------
  // 1. CREATE DEMO SOCIETY
  // --------------------------------------------------

  const society = await prisma.society.create({
    data: {
      name: "Green Valley Residency",
      address: "Vellore, Tamil Nadu",
    },
  });

  console.log(`🏢 Created society: ${society.name}`);

  // --------------------------------------------------
  // 2. PASSWORD HASHES
  // --------------------------------------------------

  const adminPassword = await bcrypt.hash("Admin@123", 10);
  const residentPassword = await bcrypt.hash("Resident@123", 10);

  // --------------------------------------------------
  // 3. CREATE ADMIN
  // --------------------------------------------------

  const admin = await prisma.user.create({
    data: {
      name: "Society Admin",
      email: "admin@societypulse.demo",
      passwordHash: adminPassword,
      role: "ADMIN",
      societyId: society.id,
    },
  });

  console.log(`👨‍💼 Created admin: ${admin.email}`);

  // --------------------------------------------------
  // 4. CREATE RESIDENTS
  // --------------------------------------------------

  const resident1 = await prisma.user.create({
    data: {
      name: "Aarav Sharma",
      email: "aarav@societypulse.demo",
      passwordHash: residentPassword,
      role: "RESIDENT",
      societyId: society.id,
    },
  });

  const resident2 = await prisma.user.create({
    data: {
      name: "Diya Nair",
      email: "diya@societypulse.demo",
      passwordHash: residentPassword,
      role: "RESIDENT",
      societyId: society.id,
    },
  });

  const resident3 = await prisma.user.create({
    data: {
      name: "Rohan Mehta",
      email: "rohan@societypulse.demo",
      passwordHash: residentPassword,
      role: "RESIDENT",
      societyId: society.id,
    },
  });

  console.log("👥 Created 3 residents");

  // --------------------------------------------------
  // 5. CREATE LOCATIONS
  // --------------------------------------------------

  const blockA1 = await prisma.location.create({
    data: {
      name: "Block A - Floor 1",
      block: "A",
      floor: "1",
      description: "Block A first floor",
      qrCode: "GREEN-VALLEY-A-1",
      societyId: society.id,
    },
  });

  const blockA2 = await prisma.location.create({
    data: {
      name: "Block A - Floor 2",
      block: "A",
      floor: "2",
      description: "Block A second floor",
      qrCode: "GREEN-VALLEY-A-2",
      societyId: society.id,
    },
  });

  const blockA3 = await prisma.location.create({
    data: {
      name: "Block A - Floor 3",
      block: "A",
      floor: "3",
      description: "Block A third floor",
      qrCode: "GREEN-VALLEY-A-3",
      societyId: society.id,
    },
  });

  const blockB1 = await prisma.location.create({
    data: {
      name: "Block B - Floor 1",
      block: "B",
      floor: "1",
      description: "Block B first floor",
      qrCode: "GREEN-VALLEY-B-1",
      societyId: society.id,
    },
  });

  console.log("📍 Created 4 locations");

  // --------------------------------------------------
  // 6. CREATE SLA RULES
  // --------------------------------------------------

  const criticalSla = await prisma.sLA.create({
    data: {
      name: "Critical Issues",
      priorityLabel: "CRITICAL",
      resolutionHours: 4,
      societyId: society.id,
    },
  });

  const highSla = await prisma.sLA.create({
    data: {
      name: "High Priority Issues",
      priorityLabel: "HIGH",
      resolutionHours: 12,
      societyId: society.id,
    },
  });

  const mediumSla = await prisma.sLA.create({
    data: {
      name: "Medium Priority Issues",
      priorityLabel: "MEDIUM",
      resolutionHours: 24,
      societyId: society.id,
    },
  });

  const lowSla = await prisma.sLA.create({
    data: {
      name: "Low Priority Issues",
      priorityLabel: "LOW",
      resolutionHours: 72,
      societyId: society.id,
    },
  });

  console.log("⏱️ Created SLA rules");

  // --------------------------------------------------
  // 7. CREATE COMPLAINT GROUPS
  // --------------------------------------------------

  const waterLeakageGroup = await prisma.complaintGroup.create({
    data: {
      name: "Recurring Water Leakage",
      category: "WATER",
      locationId: blockA3.id,
      description: "Repeated water leakage complaints from Block A Floor 3",
      complaintCount: 3,
affectedResidents: 3,
      societyId: society.id,
    },
  });

  console.log("🔁 Created recurring issue group");

  // --------------------------------------------------
  // 8. CREATE COMPLAINTS
  // --------------------------------------------------

  const complaint1 = await prisma.complaint.create({
    data: {
      title: "Water leakage near staircase",
      description:
        "There is continuous water leakage near the staircase on the third floor.",
      category: "WATER",
      severity: 5,
      priorityScore: 85,
      priorityLabel: "CRITICAL",
      affectedResidentsEstimated: 3,
      affectedResidentsVerified: 3,
      status: "IN_PROGRESS",
      reporterId: resident1.id,
      societyId: society.id,
      locationId: blockA3.id,
      assignedToId: admin.id,
      groupId: waterLeakageGroup.id,
      slaId: criticalSla.id,
      dueAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
    },
  });

  const complaint2 = await prisma.complaint.create({
    data: {
      title: "Lift making unusual noise",
      description:
        "The lift is making loud noises while moving between floors.",
      category: "LIFT",
      severity: 4,
      priorityScore: 68,
      priorityLabel: "HIGH",
      affectedResidentsEstimated: 5,
      status: "OPEN",
      reporterId: resident2.id,
      societyId: society.id,
      locationId: blockA2.id,
      slaId: highSla.id,
      dueAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
    },
  });

  const complaint3 = await prisma.complaint.create({
    data: {
      title: "Power fluctuation in apartment",
      description:
        "Frequent power fluctuations have been occurring during the evening.",
      category: "ELECTRICAL",
      severity: 3,
      priorityScore: 48,
      priorityLabel: "MEDIUM",
      affectedResidentsEstimated: 2,
      status: "RESOLVED",
      reporterId: resident3.id,
      societyId: society.id,
      locationId: blockB1.id,
      slaId: mediumSla.id,
      resolvedAt: new Date(),
    },
  });

  const complaint4 = await prisma.complaint.create({
    data: {
      title: "Garbage collection delayed",
      description:
        "Garbage has not been collected from the common area since yesterday.",
      category: "CLEANLINESS",
      severity: 2,
      priorityScore: 28,
      priorityLabel: "LOW",
      affectedResidentsEstimated: 4,
      status: "CLOSED",
      reporterId: resident1.id,
      societyId: society.id,
      locationId: blockA1.id,
      slaId: lowSla.id,
      resolvedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      closedAt: new Date(),
    },
  });

  console.log("📝 Created 4 complaints");

  // --------------------------------------------------
  // 9. ADD COMMENTS
  // --------------------------------------------------

  await prisma.complaintComment.create({
    data: {
      content: "Maintenance team has been notified.",
      complaintId: complaint1.id,
      authorId: admin.id,
    },
  });

  await prisma.complaintComment.create({
    data: {
      content: "The technician will inspect the lift today.",
      complaintId: complaint2.id,
      authorId: admin.id,
    },
  });

  console.log("💬 Created comments");

  // --------------------------------------------------
  // 10. STATUS HISTORY
  // --------------------------------------------------

  await prisma.complaintStatusHistory.create({
    data: {
      status: "OPEN",
      note: "Complaint submitted by resident.",
      complaintId: complaint1.id,
      changedById: resident1.id,
    },
  });

  await prisma.complaintStatusHistory.create({
    data: {
      status: "IN_PROGRESS",
      note: "Assigned to maintenance team.",
      complaintId: complaint1.id,
      changedById: admin.id,
    },
  });

  await prisma.complaintStatusHistory.create({
    data: {
      status: "OPEN",
      note: "Complaint submitted by resident.",
      complaintId: complaint2.id,
      changedById: resident2.id,
    },
  });

  await prisma.complaintStatusHistory.create({
    data: {
      status: "RESOLVED",
      note: "Electrical issue fixed.",
      complaintId: complaint3.id,
      changedById: admin.id,
    },
  });

  await prisma.complaintStatusHistory.create({
    data: {
      status: "CLOSED",
      note: "Complaint resolved and closed.",
      complaintId: complaint4.id,
      changedById: admin.id,
    },
  });

  console.log("📜 Created status history");

  // --------------------------------------------------
  // 11. SATISFACTION RATING
  // --------------------------------------------------

  await prisma.satisfactionRating.create({
    data: {
      score: 5,
      comment: "The issue was resolved quickly.",
      complaintId: complaint3.id,
      residentId: resident3.id,
    },
  });

  console.log("⭐ Created satisfaction rating");

  // --------------------------------------------------
  // 12. NOTICES
  // --------------------------------------------------

  await prisma.notice.create({
    data: {
      title: "Water Tank Maintenance",
      content:
        "Water tank maintenance will be carried out on Sunday from 10 AM to 1 PM.",
      type: "MAINTENANCE",
      isImportant: true,
      societyId: society.id,
      authorId: admin.id,
    },
  });

  await prisma.notice.create({
    data: {
      title: "Society Cleanliness Drive",
      content:
        "A cleanliness drive will be conducted this Saturday in the common areas.",
      type: "EVENT",
      isImportant: false,
      societyId: society.id,
      authorId: admin.id,
    },
  });

  console.log("📢 Created notices");

  console.log("");
  console.log("🎉 SocietyPulse seed completed successfully!");
  console.log("");
  console.log("Demo credentials:");
  console.log("Admin:    admin@societypulse.demo / Admin@123");
  console.log("Resident: aarav@societypulse.demo / Resident@123");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });