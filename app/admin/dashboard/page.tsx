import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";
import { authOptions } from "../../../lib/auth";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/resident/dashboard");
  }

  const admin = await prisma.user.findUnique({
    where: {
      email: session.user.email!,
    },
    select: {
      societyId: true,
      name: true,
    },
  });

  if (!admin) {
    redirect("/login");
  }
const complaints = await prisma.complaint.findMany({
  where: {
    societyId: admin.societyId,
  },
  select: {
  id: true,
  title: true,
  category: true,
  priorityLabel: true,
  status: true,
  dueAt: true,
  createdAt: true,
  affectedResidentsEstimated: true,
affectedResidentsVerified: true,

  location: {
    select: {
      name: true,
      block: true,
      floor: true,
    },
  },

  group: {
    select: {
      id: true,
      name: true,
      category: true,
      complaintCount: true,
      affectedResidents: true,
      isActive: true,
    },
  },
},
  
  orderBy: {
    createdAt: "desc",
  },
});

  const now = new Date();

  const totalComplaints = complaints.length;
  const categoryCounts = complaints.reduce(
  (counts, complaint) => {
    counts[complaint.category] =
      (counts[complaint.category] || 0) + 1;

    return counts;
  },
  {} as Record<string, number>,
);
const priorityCounts = complaints.reduce(
  (counts, complaint) => {
    counts[complaint.priorityLabel] =
      (counts[complaint.priorityLabel] || 0) + 1;

    return counts;
  },
  {} as Record<string, number>,
);
const statusCounts = complaints.reduce(
  (counts, complaint) => {
    counts[complaint.status] =
      (counts[complaint.status] || 0) + 1;

    return counts;
  },
  {} as Record<string, number>,
);
const complaintTrends = Object.entries(
  complaints.reduce(
    (counts, complaint) => {
      const date = complaint.createdAt
        .toISOString()
        .split("T")[0];

      counts[date] = (counts[date] || 0) + 1;

      return counts;
    },
    {} as Record<string, number>,
  ),
).sort(([dateA], [dateB]) => dateA.localeCompare(dateB));
const recurringIssues = complaints
  .filter(
    (complaint) =>
      complaint.group !== null &&
      complaint.group.isActive &&
      complaint.group.complaintCount > 1,
  )
  .reduce(
    (groups, complaint) => {
      const group = complaint.group;

      if (!group) {
        return groups;
      }

      if (!groups[group.id]) {
        groups[group.id] = {
          id: group.id,
          name: group.name,
          category: group.category,
          complaintCount: group.complaintCount,
          affectedResidents: group.affectedResidents,
        };
      }

      return groups;
    },
    {} as Record<
      string,
      {
        id: string;
        name: string;
        category: string;
        complaintCount: number;
        affectedResidents: number;
      }
    >,
  );
const locationHotspots = complaints.reduce(
  (locations, complaint) => {
    const key = complaint.location.name;

    if (!locations[key]) {
      locations[key] = {
        complaintCount: 0,
        affectedResidents: 0,
      };
    }

    locations[key].complaintCount += 1;

    locations[key].affectedResidents +=
      complaint.affectedResidentsVerified ??
      complaint.affectedResidentsEstimated;

    return locations;
  },
  {} as Record<
    string,
    {
      complaintCount: number;
      affectedResidents: number;
    }
  >,
);

  const openComplaints = complaints.filter(
    (complaint) => complaint.status === "OPEN",
  ).length;

  const inProgressComplaints = complaints.filter(
    (complaint) => complaint.status === "IN_PROGRESS",
  ).length;

  const resolvedComplaints = complaints.filter(
    (complaint) => complaint.status === "RESOLVED",
  ).length;

  const closedComplaints = complaints.filter(
    (complaint) => complaint.status === "CLOSED",
  ).length;
  const activeImpact =
  openComplaints + inProgressComplaints;

const resolvedImpact =
  resolvedComplaints + closedComplaints;

const totalImpact = complaints.length;
  const overdueComplaints = complaints.filter(
    (complaint) =>
      complaint.dueAt !== null &&
      complaint.dueAt < now &&
      complaint.status !== "RESOLVED" &&
      complaint.status !== "CLOSED",
  ).length;

  const complaintsWithSla = complaints.filter(
    (complaint) => complaint.dueAt !== null,
  ).length;

  const completedWithSla = complaints.filter(
    (complaint) =>
      complaint.dueAt !== null &&
      (complaint.status === "RESOLVED" ||
        complaint.status === "CLOSED"),
  ).length;

  const slaCompliance =
    complaintsWithSla > 0
      ? Math.round((completedWithSla / complaintsWithSla) * 100)
      : 100;

  return (
    <main className="min-h-screen bg-gray-100 p-8 text-gray-900">
      <div className="mx-auto max-w-7xl">
        <div>
          <h1 className="text-3xl font-bold">
            Admin Dashboard
          </h1>

          <p className="mt-2 text-gray-700">
            Welcome, {admin.name}.
          </p>
        </div>

        {/* Main metrics */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-600">
              Total Complaints
            </p>

            <p className="mt-2 text-3xl font-bold">
              {totalComplaints}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-600">
              Open
            </p>

            <p className="mt-2 text-3xl font-bold">
              {openComplaints}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-600">
              In Progress
            </p>

            <p className="mt-2 text-3xl font-bold">
              {inProgressComplaints}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-600">
              Overdue
            </p>

            <p className="mt-2 text-3xl font-bold">
              {overdueComplaints}
            </p>
          </div>
        </div>

        {/* Secondary metrics */}
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-600">
              Resolved
            </p>

            <p className="mt-2 text-3xl font-bold">
              {resolvedComplaints}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-600">
              Closed
            </p>

            <p className="mt-2 text-3xl font-bold">
              {closedComplaints}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-600">
              SLA Compliance
            </p>

            <p className="mt-2 text-3xl font-bold">
              {slaCompliance}%
            </p>
          </div>
        </div>

        {/* Society overview */}
        <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">
            Society Overview
          </h2>

          <p className="mt-2 text-gray-700">
            Complaint analytics, recurring issues, hotspots,
            SLA performance, and society health metrics will
            appear here.
          </p>

                   <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-600">
                Active complaints
              </p>

              <p className="mt-1 text-xl font-semibold">
                {openComplaints + inProgressComplaints}
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-600">
                Completed complaints
              </p>

              <p className="mt-1 text-xl font-semibold">
                {resolvedComplaints + closedComplaints}
              </p>
            </div>
          </div>

          {/* ADD THE NEW CATEGORY ANALYTICS HERE */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold">
              Complaint Categories
            </h3>

            <div className="mt-4 space-y-3">
              {Object.entries(categoryCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([category, count]) => (
                  <div
                    key={category}
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-4"
                  >
                    <span className="font-medium text-gray-800">
                      {category}
                    </span>

                    <span className="rounded-full bg-gray-200 px-3 py-1 text-sm font-semibold">
                      {count}
                    </span>
                  </div>
                ))}

              {Object.keys(categoryCounts).length === 0 && (
                <p className="text-sm text-gray-600">
                  No category data available yet.
                </p>
              )}
            </div>
          </div>
           {/* Priority Analytics */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold">
              Complaint Priority
            </h3>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(priorityCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([priority, count]) => (
                  <div
                    key={priority}
                    className="rounded-lg bg-gray-50 p-4"
                  >
                    <p className="text-sm text-gray-600">
                      {priority}
                    </p>

                    <p className="mt-1 text-2xl font-semibold">
                      {count}
                    </p>
                  </div>
                ))}

              {Object.keys(priorityCounts).length === 0 && (
                <p className="text-sm text-gray-600">
                  No priority data available yet.
                </p>
              )}
            </div>
          </div>
           {/* Status Analytics */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold">
              Complaint Status
            </h3>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(statusCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([status, count]) => (
                  <div
                    key={status}
                    className="rounded-lg bg-gray-50 p-4"
                  >
                    <p className="text-sm text-gray-600">
                      {status}
                    </p>

                    <p className="mt-1 text-2xl font-semibold">
                      {count}
                    </p>
                  </div>
                ))}

              {Object.keys(statusCounts).length === 0 && (
                <p className="text-sm text-gray-600">
                  No status data available yet.
                </p>
              )}
            </div>
          </div>
          {/* Complaint Trends */}
<div className="mt-8">
  <h3 className="text-lg font-semibold">
    Complaint Trends
  </h3>

  <div className="mt-4 space-y-3">
    {complaintTrends.length > 0 ? (
      complaintTrends.map(([date, count]) => (
        <div
          key={date}
          className="flex items-center gap-4"
        >
          <span className="w-24 shrink-0 text-sm text-gray-600">
            {date}
          </span>

          <div className="flex-1 rounded-full bg-gray-100">
            <div
              className="rounded-full bg-gray-800 px-3 py-1 text-xs font-semibold text-white"
              style={{
                width: `${Math.max(
                  (count /
                    Math.max(
                      ...complaintTrends.map(
                        ([, value]) => value,
                      ),
                    )) *
                    100,
                  8,
                )}%`,
              }}
            >
              {count}
            </div>
          </div>
        </div>
      ))
    ) : (
      <p className="text-sm text-gray-600">
        No complaint trend data available yet.
      </p>
    )}
  </div>
</div>
{/* Recurring Issues */}
<div className="mt-8">
  <h3 className="text-lg font-semibold">
    Recurring Issues
  </h3>

  <div className="mt-4 space-y-3">
    {Object.values(recurringIssues)
      .sort((a, b) => b.complaintCount - a.complaintCount)
      .map((group) => (
        <a
  key={group.id}
  href={`/admin/complaint-groups/${group.id}`}
  className="block rounded-lg bg-gray-50 p-4 transition hover:bg-gray-100 hover:shadow-sm"
>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-medium text-gray-800">
                {group.name}
              </p>

              <p className="mt-1 text-sm text-gray-600">
                {group.category} • {group.complaintCount} complaints
              </p>

              <p className="mt-1 text-xs text-gray-500">
                {group.affectedResidents} affected residents
              </p>
            </div>

            <span className="rounded-full bg-gray-200 px-3 py-1 text-sm font-semibold">
              Recurring
            </span>
          </div>
        </a>
      ))}

    {Object.keys(recurringIssues).length === 0 && (
      <p className="text-sm text-gray-600">
        No recurring issues detected yet.
      </p>
    )}
  </div>
</div>
{/* Complaint Hotspots */}
<div className="mt-8">
  <h3 className="text-lg font-semibold">
    Complaint Hotspots
  </h3>

  <div className="mt-4 space-y-3">
    {Object.entries(locationHotspots)
      .sort(
        ([, a], [, b]) =>
          b.affectedResidents - a.affectedResidents ||
          b.complaintCount - a.complaintCount,
      )
      .map(([location, hotspot]) => (
        <div
          key={location}
          className="rounded-lg bg-gray-50 p-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-medium text-gray-800">
                {location}
              </p>

              <p className="mt-1 text-sm text-gray-600">
                {hotspot.complaintCount}{" "}
                {hotspot.complaintCount === 1
                  ? "complaint"
                  : "complaints"}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                {hotspot.affectedResidents} affected residents
              </p>
            </div>

            <span className="rounded-full bg-gray-200 px-3 py-1 text-sm font-semibold">
              Hotspot
            </span>
          </div>
        </div>
      ))}

    {Object.keys(locationHotspots).length === 0 && (
      <p className="text-sm text-gray-600">
        No location data available yet.
      </p>
    )}
  </div>
</div>
{/* Resident Impact Analytics */}
<div className="mt-8">
  <h3 className="text-lg font-semibold">
    Resident Impact
  </h3>

  <div className="mt-4 grid gap-4 md:grid-cols-3">
    <div className="rounded-lg bg-gray-50 p-4">
      <p className="text-sm text-gray-600">
        Active Impact
      </p>

      <p className="mt-1 text-2xl font-semibold">
        {activeImpact}
      </p>

      <p className="mt-1 text-xs text-gray-500">
        Open + In Progress complaints
      </p>
    </div>

    <div className="rounded-lg bg-gray-50 p-4">
      <p className="text-sm text-gray-600">
        Resolved Impact
      </p>

      <p className="mt-1 text-2xl font-semibold">
        {resolvedImpact}
      </p>

      <p className="mt-1 text-xs text-gray-500">
        Resolved + Closed complaints
      </p>
    </div>

    <div className="rounded-lg bg-gray-50 p-4">
      <p className="text-sm text-gray-600">
        Total Affected
      </p>

      <p className="mt-1 text-2xl font-semibold">
        {totalImpact}
      </p>

      <p className="mt-1 text-xs text-gray-500">
        Total complaints received
      </p>
    </div>
  </div>
</div>

        </div>
	        {/* Recent Complaints */}
        <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Recent Complaints
            </h2>

            <p className="text-sm text-gray-600">
              {totalComplaints} total
            </p>
          </div>

          <div className="mt-6 space-y-4">
            {complaints.slice(0, 8).map((complaint) => (
              <a
                key={complaint.id}
                href={`/admin/complaints/${complaint.id}`}
                className="block rounded-lg border border-gray-200 p-4 transition hover:border-gray-400 hover:shadow-sm"
                >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {complaint.title}
                    </h3>

                    <p className="mt-1 text-sm text-gray-600">
                      {complaint.location.name}
                      {complaint.location.block
                        ? ` • Block ${complaint.location.block}`
                        : ""}
                      {complaint.location.floor
                        ? ` • Floor ${complaint.location.floor}`
                        : ""}
                    </p>
                  </div>

                 <div className="flex flex-wrap gap-2">
  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold">
    {complaint.priorityLabel}
  </span>

  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold">
    {complaint.status}
  </span>

  {complaint.dueAt && (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        complaint.status === "RESOLVED" ||
        complaint.status === "CLOSED"
          ? "bg-green-100 text-green-700"
          : complaint.dueAt < now
            ? "bg-red-100 text-red-700"
            : complaint.dueAt.getTime() - now.getTime() <=
                24 * 60 * 60 * 1000
              ? "bg-yellow-100 text-yellow-700"
              : "bg-green-100 text-green-700"
      }`}
    >
      {complaint.status === "RESOLVED" ||
      complaint.status === "CLOSED"
        ? "SLA COMPLETED"
        : complaint.dueAt < now
          ? "SLA OVERDUE"
          : complaint.dueAt.getTime() - now.getTime() <=
              24 * 60 * 60 * 1000
            ? "SLA DUE SOON"
            : "SLA ON TRACK"}
    </span>
  )}
</div>
                </div>
              </a>
            ))}

            {complaints.length === 0 && (
              <p className="text-sm text-gray-600">
                No complaints have been submitted yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
