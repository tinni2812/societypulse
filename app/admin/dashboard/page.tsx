import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import NotificationItem from "./NotificationItem";
import NotificationList from "./NotificationList";

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
    id: true,
    societyId: true,
    name: true,
  },
});

  if (!admin) {
    redirect("/login");
  }
  const notifications = await prisma.notification.findMany({
  where: {
    recipientId: admin.id,
  },
  orderBy: {
    createdAt: "desc",
  },
  take: 10,
});
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

statusHistory: {
  where: {
    status: {
      in: ["RESOLVED", "CLOSED"],
    },
  },
  orderBy: {
    createdAt: "asc",
  },
  select: {
    status: true,
    createdAt: true,
  },
},

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
    const key =
  complaint.location.name.trim() || "Unknown Location";

    if (!locations[key]) {
      locations[key] = {
        complaintCount: 0,
        affectedResidents: 0,
        activeComplaints: 0,
        highPriorityComplaints: 0,
        recurringComplaints: 0,
      };
    }

    locations[key].complaintCount += 1;

    locations[key].affectedResidents +=
      complaint.affectedResidentsVerified ??
      complaint.affectedResidentsEstimated;

    if (
      complaint.status === "OPEN" ||
      complaint.status === "IN_PROGRESS"
    ) {
      locations[key].activeComplaints += 1;
    }

    if (
      complaint.priorityLabel === "HIGH" ||
      complaint.priorityLabel === "CRITICAL"
    ) {
      locations[key].highPriorityComplaints += 1;
    }

    if (
      complaint.group !== null &&
      complaint.group.isActive &&
      complaint.group.complaintCount > 1
    ) {
      locations[key].recurringComplaints += 1;
    }

    return locations;
  },
  {} as Record<
    string,
    {
      complaintCount: number;
      affectedResidents: number;
      activeComplaints: number;
      highPriorityComplaints: number;
      recurringComplaints: number;
    }
  >,
);
const hotspotLocations = Object.entries(locationHotspots);

const maxComplaintCount = Math.max(
  ...hotspotLocations.map(([, hotspot]) => hotspot.complaintCount),
  1,
);

const maxAffectedResidents = Math.max(
  ...hotspotLocations.map(([, hotspot]) => hotspot.affectedResidents),
  1,
);

const maxActiveComplaints = Math.max(
  ...hotspotLocations.map(([, hotspot]) => hotspot.activeComplaints),
  1,
);

const maxHighPriorityComplaints = Math.max(
  ...hotspotLocations.map(
    ([, hotspot]) => hotspot.highPriorityComplaints,
  ),
  1,
);

const maxRecurringComplaints = Math.max(
  ...hotspotLocations.map(
    ([, hotspot]) => hotspot.recurringComplaints,
  ),
  1,
);

const rankedHotspots = hotspotLocations
  .map(([location, hotspot]) => {
    const complaintConcentration =
      (hotspot.complaintCount / maxComplaintCount) * 100;

    const residentImpact =
      (hotspot.affectedResidents / maxAffectedResidents) * 100;

    const activeBurden =
      (hotspot.activeComplaints / maxActiveComplaints) * 100;

    const priorityBurden =
      (hotspot.highPriorityComplaints /
        maxHighPriorityComplaints) *
      100;

    const recurringBurden =
      (hotspot.recurringComplaints /
        maxRecurringComplaints) *
      100;

    const hotspotScore = Math.round(
      complaintConcentration * 0.30 +
        residentImpact * 0.25 +
        activeBurden * 0.20 +
        priorityBurden * 0.15 +
        recurringBurden * 0.10,
    );

    return {
      location,
      ...hotspot,
      hotspotScore,
    };
  })
  .filter(
    (hotspot) =>
      hotspot.complaintCount > 1 ||
      hotspot.activeComplaints > 1 ||
      hotspot.highPriorityComplaints > 0 ||
      hotspot.recurringComplaints > 0,
  )
  .sort(
    (a, b) =>
      b.hotspotScore - a.hotspotScore ||
      b.affectedResidents - a.affectedResidents ||
      b.complaintCount - a.complaintCount,
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
  const dueSoonComplaints = complaints.filter(
  (complaint) => {
    if (
      complaint.dueAt === null ||
      complaint.status === "RESOLVED" ||
      complaint.status === "CLOSED"
    ) {
      return false;
    }

    const hoursUntilDue =
      (complaint.dueAt.getTime() - now.getTime()) /
      (1000 * 60 * 60);

    return hoursUntilDue >= 0 && hoursUntilDue <= 24;
  },
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
      const slaByCategory = complaints.reduce(
  (result, complaint) => {
    if (complaint.dueAt === null) {
      return result;
    }

    if (!result[complaint.category]) {
      result[complaint.category] = {
        total: 0,
        completed: 0,
      };
    }

    result[complaint.category].total += 1;

    if (
      complaint.status === "RESOLVED" ||
      complaint.status === "CLOSED"
    ) {
      result[complaint.category].completed += 1;
    }

    return result;
  },
  {} as Record<
    string,
    {
      total: number;
      completed: number;
    }
  >,
);

const slaByPriority = complaints.reduce(
  (result, complaint) => {
    if (complaint.dueAt === null) {
      return result;
    }

    if (!result[complaint.priorityLabel]) {
      result[complaint.priorityLabel] = {
        total: 0,
        completed: 0,
      };
    }

    result[complaint.priorityLabel].total += 1;

    if (
      complaint.status === "RESOLVED" ||
      complaint.status === "CLOSED"
    ) {
      result[complaint.priorityLabel].completed += 1;
    }

    return result;
  },
  {} as Record<
    string,
    {
      total: number;
      completed: number;
    }
  >,
);
        const highPriorityComplaints =
    (priorityCounts["HIGH"] || 0) +
    (priorityCounts["CRITICAL"] || 0);

  const activeComplaintRate =
    totalComplaints > 0
      ? (openComplaints + inProgressComplaints) / totalComplaints
      : 0;

  const highPriorityRate =
    totalComplaints > 0
      ? highPriorityComplaints / totalComplaints
      : 0;

  const recurringComplaintCount = Object.values(
    recurringIssues,
  ).reduce(
    (total, group) => total + group.complaintCount,
    0,
  );

  const recurringIssueRate =
    totalComplaints > 0
      ? Math.min(recurringComplaintCount / totalComplaints, 1)
      : 0;

  const resolutionRate =
    totalComplaints > 0
      ? (resolvedComplaints + closedComplaints) /
        totalComplaints
      : 0;
      const resolvedComplaintsWithTime = complaints
  .map((complaint) => {
    const resolutionEvent = complaint.statusHistory[0];

    if (!resolutionEvent) {
      return null;
    }

    const resolutionTime =
      resolutionEvent.createdAt.getTime() -
      complaint.createdAt.getTime();

    return {
      complaint,
      resolutionTime,
    };
  })
  .filter(
    (
      item,
    ): item is {
      complaint: (typeof complaints)[number];
      resolutionTime: number;
    } => item !== null && item.resolutionTime >= 0,
  );

const averageResolutionTimeHours =
  resolvedComplaintsWithTime.length > 0
    ? Math.round(
        resolvedComplaintsWithTime.reduce(
          (total, item) => total + item.resolutionTime,
          0,
        ) /
          resolvedComplaintsWithTime.length /
          (1000 * 60 * 60),
      )
    : 0;

const resolutionByCategory = resolvedComplaintsWithTime.reduce(
  (result, item) => {
    const category = item.complaint.category;

    if (!result[category]) {
      result[category] = {
        total: 0,
        resolutionTime: 0,
      };
    }

    result[category].total += 1;
    result[category].resolutionTime += item.resolutionTime;

    return result;
  },
  {} as Record<
    string,
    {
      total: number;
      resolutionTime: number;
    }
  >,
);

const resolutionByPriority = resolvedComplaintsWithTime.reduce(
  (result, item) => {
    const priority = item.complaint.priorityLabel;

    if (!result[priority]) {
      result[priority] = {
        total: 0,
        resolutionTime: 0,
      };
    }

    result[priority].total += 1;
    result[priority].resolutionTime += item.resolutionTime;

    return result;
  },
  {} as Record<
    string,
    {
      total: number;
      resolutionTime: number;
    }
  >,
);

const openResolvedTrends = Object.entries(
  complaints.reduce(
    (counts, complaint) => {
      const date = complaint.createdAt
        .toISOString()
        .split("T")[0];

      if (!counts[date]) {
        counts[date] = {
          open: 0,
          resolved: 0,
        };
      }

      if (
        complaint.status === "OPEN" ||
        complaint.status === "IN_PROGRESS"
      ) {
        counts[date].open += 1;
      }

      if (
        complaint.status === "RESOLVED" ||
        complaint.status === "CLOSED"
      ) {
        counts[date].resolved += 1;
      }

      return counts;
    },
    {} as Record<
      string,
      {
        open: number;
        resolved: number;
      }
    >,
  ),
).sort(([dateA], [dateB]) =>
  dateA.localeCompare(dateB),
);

  const activeComplaintHealth =
    (1 - activeComplaintRate) * 100;

  const priorityHealth =
    (1 - highPriorityRate) * 100;

  const recurringHealth =
    (1 - recurringIssueRate) * 100;

  const resolutionHealth =
    resolutionRate * 100;

  const maintenanceHealthScore =
    totalComplaints > 0
      ? Math.round(
          activeComplaintHealth * 0.25 +
            priorityHealth * 0.20 +
            recurringHealth * 0.20 +
            slaCompliance * 0.20 +
            resolutionHealth * 0.15,
        )
      : null;

  const maintenanceHealthLabel =
    maintenanceHealthScore === null
      ? "No Data"
      : maintenanceHealthScore >= 80
        ? "Excellent"
        : maintenanceHealthScore >= 65
          ? "Good"
          : maintenanceHealthScore >= 50
            ? "Needs Attention"
            : maintenanceHealthScore >= 25
              ? "Poor"
              : "Critical";

  return (
    <main className="min-h-screen bg-gray-100 p-8 text-gray-900">
        <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
  <div className="flex items-center justify-between">
    <h2 className="text-xl font-semibold text-gray-900">
      Notifications
    </h2>

    <span className="text-sm text-gray-500">
      {notifications.filter((notification) => !notification.isRead).length} unread
    </span>
  </div>

  <NotificationList notifications={notifications} />
</div>
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
          <div className="rounded-xl bg-white p-6 shadow-sm">
  <p className="text-sm font-medium text-gray-600">
    SLA Due Soon
  </p>

  <p className="mt-2 text-3xl font-bold">
    {dueSoonComplaints}
  </p>

  <p className="mt-1 text-xs text-gray-500">
    Due within 24 hours
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
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
  <div className="rounded-xl bg-white p-6 shadow-sm">
    <h2 className="text-xl font-semibold">
      SLA Performance by Category
    </h2>

    <div className="mt-4 space-y-3">
      {Object.entries(slaByCategory)
        .sort(([, a], [, b]) => b.total - a.total)
        .map(([category, data]) => {
          const compliance =
            data.total > 0
              ? Math.round(
                  (data.completed / data.total) * 100,
                )
              : 0;

          return (
            <div
              key={category}
              className="flex items-center justify-between rounded-lg bg-gray-50 p-4"
            >
              <div>
                <p className="font-medium text-gray-800">
                  {category}
                </p>
                <p className="text-xs text-gray-500">
                  {data.completed}/{data.total} completed
                </p>
              </div>

              <span className="text-lg font-semibold">
                {compliance}%
              </span>
            </div>
          );
        })}

      {Object.keys(slaByCategory).length === 0 && (
        <p className="text-sm text-gray-600">
          No SLA category data available yet.
        </p>
      )}
    </div>
  </div>

  <div className="rounded-xl bg-white p-6 shadow-sm">
    <h2 className="text-xl font-semibold">
      SLA Performance by Priority
    </h2>

    <div className="mt-4 space-y-3">
      {Object.entries(slaByPriority)
        .sort(([, a], [, b]) => b.total - a.total)
        .map(([priority, data]) => {
          const compliance =
            data.total > 0
              ? Math.round(
                  (data.completed / data.total) * 100,
                )
              : 0;

          return (
            <div
              key={priority}
              className="flex items-center justify-between rounded-lg bg-gray-50 p-4"
            >
              <div>
                <p className="font-medium text-gray-800">
                  {priority}
                </p>
                <p className="text-xs text-gray-500">
                  {data.completed}/{data.total} completed
                </p>
              </div>

              <span className="text-lg font-semibold">
                {compliance}%
              </span>
            </div>
          );
        })}

      {Object.keys(slaByPriority).length === 0 && (
        <p className="text-sm text-gray-600">
          No SLA priority data available yet.
        </p>
      )}
    </div>
  </div>
</div>
{/* Resolution Analytics */}
<div className="mt-8 grid gap-6 lg:grid-cols-2">
  <div className="rounded-xl bg-white p-6 shadow-sm">
    <h2 className="text-xl font-semibold">
      Resolution Analytics
    </h2>

    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <div className="rounded-lg bg-gray-50 p-4">
        <p className="text-sm text-gray-600">
          Resolution Rate
        </p>

        <p className="mt-1 text-3xl font-bold">
          {Math.round(resolutionRate * 100)}%
        </p>
      </div>

      <div className="rounded-lg bg-gray-50 p-4">
        <p className="text-sm text-gray-600">
          Avg. Resolution Time
        </p>

        <p className="mt-1 text-3xl font-bold">
          {resolvedComplaintsWithTime.length > 0
            ? `${averageResolutionTimeHours}h`
            : "No Data"}
        </p>
      </div>
    </div>

    <p className="mt-4 text-sm text-gray-600">
      Resolution metrics are calculated from complaints that
      reached the resolved or closed state.
    </p>
  </div>

  <div className="rounded-xl bg-white p-6 shadow-sm">
    <h2 className="text-xl font-semibold">
      Open vs Resolved
    </h2>

    <div className="mt-4 space-y-3">
      {openResolvedTrends.length > 0 ? (
        openResolvedTrends.map(([date, data]) => (
          <div
            key={date}
            className="rounded-lg bg-gray-50 p-4"
          >
            <p className="text-sm font-medium text-gray-700">
              {date}
            </p>

            <div className="mt-2 flex gap-6 text-sm">
              <span>
                Open:{" "}
                <strong>{data.open}</strong>
              </span>

              <span>
                Resolved:{" "}
                <strong>{data.resolved}</strong>
              </span>
            </div>
          </div>
        ))
      ) : (
        <p className="text-sm text-gray-600">
          No resolution trend data available yet.
        </p>
      )}
    </div>
  </div>
</div>

<div className="mt-8 grid gap-6 lg:grid-cols-2">
  <div className="rounded-xl bg-white p-6 shadow-sm">
    <h2 className="text-xl font-semibold">
      Resolution Performance by Category
    </h2>

    <div className="mt-4 space-y-3">
      {Object.entries(resolutionByCategory)
        .sort(([, a], [, b]) => b.total - a.total)
        .map(([category, data]) => {
          const averageHours =
            data.total > 0
              ? Math.round(
                  data.resolutionTime /
                    data.total /
                    (1000 * 60 * 60),
                )
              : 0;

          return (
            <div
              key={category}
              className="flex items-center justify-between rounded-lg bg-gray-50 p-4"
            >
              <div>
                <p className="font-medium text-gray-800">
                  {category}
                </p>

                <p className="text-xs text-gray-500">
                  {data.total} resolved
                </p>
              </div>

              <span className="text-lg font-semibold">
                {averageHours}h
              </span>
            </div>
          );
        })}

      {Object.keys(resolutionByCategory).length === 0 && (
        <p className="text-sm text-gray-600">
          No category resolution data available yet.
        </p>
      )}
    </div>
  </div>

  <div className="rounded-xl bg-white p-6 shadow-sm">
    <h2 className="text-xl font-semibold">
      Resolution Performance by Priority
    </h2>

    <div className="mt-4 space-y-3">
      {Object.entries(resolutionByPriority)
        .sort(([, a], [, b]) => b.total - a.total)
        .map(([priority, data]) => {
          const averageHours =
            data.total > 0
              ? Math.round(
                  data.resolutionTime /
                    data.total /
                    (1000 * 60 * 60),
                )
              : 0;

          return (
            <div
              key={priority}
              className="flex items-center justify-between rounded-lg bg-gray-50 p-4"
            >
              <div>
                <p className="font-medium text-gray-800">
                  {priority}
                </p>

                <p className="text-xs text-gray-500">
                  {data.total} resolved
                </p>
              </div>

              <span className="text-lg font-semibold">
                {averageHours}h
              </span>
            </div>
          );
        })}

      {Object.keys(resolutionByPriority).length === 0 && (
        <p className="text-sm text-gray-600">
          No priority resolution data available yet.
        </p>
      )}
    </div>
  </div>
</div>
               {/* Maintenance Health Score */}
<div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
  <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
    <div>
      <p className="text-sm font-medium text-gray-600">
        Maintenance Health Score
      </p>

      <div className="mt-2 flex items-baseline gap-3">
        <p className="text-4xl font-bold">
          {maintenanceHealthScore !== null
            ? `${maintenanceHealthScore}/100`
            : "No Data"}
        </p>

        <p className="text-sm font-semibold text-gray-700">
          {maintenanceHealthLabel}
        </p>
      </div>

      <p className="mt-2 max-w-xl text-sm text-gray-600">
        Overall maintenance health based on active complaints,
        priority burden, recurring issues, SLA performance, and
        resolution performance.
      </p>
    </div>

    <div className="grid grid-cols-3 gap-3 lg:min-w-[420px]">
      <div className="rounded-lg bg-gray-50 p-4">
        <p className="text-xs font-medium text-gray-500">
          Active
        </p>

        <p className="mt-1 text-xl font-semibold">
          {openComplaints + inProgressComplaints}
        </p>
      </div>

      <div className="rounded-lg bg-gray-50 p-4">
        <p className="text-xs font-medium text-gray-500">
          Recurring
        </p>

        <p className="mt-1 text-xl font-semibold">
          {Object.keys(recurringIssues).length}
        </p>
      </div>

      <div className="rounded-lg bg-gray-50 p-4">
        <p className="text-xs font-medium text-gray-500">
          SLA
        </p>

        <p className="mt-1 text-xl font-semibold">
          {slaCompliance}%
        </p>
      </div>
    </div>
  </div>
</div>

        {/* Society overview */}
        <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">
            Society Overview
          </h2>

          <p className="mt-2 text-gray-700">
  Monitor complaint patterns, recurring maintenance issues,
  location hotspots, SLA performance, and resolution health
  to identify areas that need attention.
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
  <div>
    <h3 className="text-lg font-semibold">
      Complaint Hotspots
    </h3>

    <p className="mt-1 text-sm text-gray-600">
      Locations are ranked using complaint concentration,
      resident impact, active burden, priority severity,
      and recurring issues.
    </p>
  </div>

  <div className="mt-4 space-y-4">
    {rankedHotspots.length > 0 ? (
      rankedHotspots.map((hotspot, index) => (
        <div
          key={hotspot.location}
          className="rounded-lg bg-gray-50 p-5"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-gray-200 px-3 py-1 text-sm font-bold">
                  #{index + 1}
                </span>

                <p className="font-semibold text-gray-900">
                  {hotspot.location}
                </p>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs text-gray-500">
                    Complaints
                  </p>
                  <p className="mt-1 font-semibold">
                    {hotspot.complaintCount}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    Affected Residents
                  </p>
                  <p className="mt-1 font-semibold">
                    {hotspot.affectedResidents}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    Active Complaints
                  </p>
                  <p className="mt-1 font-semibold">
                    {hotspot.activeComplaints}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    High Priority
                  </p>
                  <p className="mt-1 font-semibold">
                    {hotspot.highPriorityComplaints}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {hotspot.highPriorityComplaints > 0 && (
                  <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold">
                    High Priority
                  </span>
                )}

                {hotspot.recurringComplaints > 0 && (
                  <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold">
                    Recurring Issue
                  </span>
                )}

                {hotspot.activeComplaints > 0 && (
                  <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold">
                    Active Problem
                  </span>
                )}
              </div>
            </div>

            <div className="shrink-0 rounded-lg bg-white px-4 py-3 text-center shadow-sm">
              <p className="text-xs text-gray-500">
                Hotspot Score
              </p>

              <p className="mt-1 text-2xl font-bold">
                {hotspot.hotspotScore}/100
              </p>
            </div>
          </div>
        </div>
      ))
    ) : (
      <div className="rounded-lg bg-gray-50 p-5">
        <p className="font-medium text-gray-800">
          No significant hotspots detected.
        </p>

        <p className="mt-1 text-sm text-gray-600">
          Hotspots will appear when complaint activity,
          resident impact, priority, or recurring issues
          indicate a meaningful location-level problem.
        </p>
      </div>
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
