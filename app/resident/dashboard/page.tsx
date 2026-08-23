import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

export default async function ResidentDashboard() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "RESIDENT") {
    redirect("/admin/dashboard");
  }

  const residentId = session.user.id;

  const complaints = await prisma.complaint.findMany({
    where: {
      reporterId: residentId,
    },
    include: {
      location: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  const notices = await prisma.notice.findMany({
    where: {
      societyId: session.user.societyId,
    },
    select: {
      id: true,
      title: true,
      content: true,
      type: true,
      isImportant: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
  });
  const totalComplaints = complaints.length;

  const openComplaints = complaints.filter(
    (complaint) => complaint.status === "OPEN"
  ).length;

  const inProgressComplaints = complaints.filter(
    (complaint) => complaint.status === "IN_PROGRESS"
  ).length;

  const resolvedComplaints = complaints.filter(
    (complaint) => complaint.status === "RESOLVED"
  ).length;

  const statusStyles: Record<string, string> = {
    OPEN: "bg-blue-100 text-blue-700",
    IN_PROGRESS: "bg-yellow-100 text-yellow-700",
    RESOLVED: "bg-green-100 text-green-700",
    CLOSED: "bg-gray-100 text-gray-700",
  };

  const priorityStyles: Record<string, string> = {
    LOW: "bg-gray-100 text-gray-700",
    MEDIUM: "bg-blue-100 text-blue-700",
    HIGH: "bg-orange-100 text-orange-700",
    CRITICAL: "bg-red-100 text-red-700",
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Resident Dashboard
          </h1>

          <p className="mt-2 text-gray-600">
            Welcome, {session.user.name}.
          </p>
        </div>

        {/* Quick actions */}
<div className="mt-6 flex flex-wrap gap-3">
  <Link
    href="/resident/complaints"
    className="inline-flex items-center rounded-lg bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
  >
    View / Submit Complaints
  </Link>

  <Link
    href="/resident/notices"
    className="inline-flex items-center rounded-lg bg-white px-5 py-3 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-gray-200 transition hover:bg-gray-50"
  >
    View Society Notices
  </Link>
</div>

        {/* Statistics */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Total Complaints
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {totalComplaints}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Open
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-600">
              {openComplaints}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              In Progress
            </p>

            <p className="mt-2 text-3xl font-bold text-yellow-600">
              {inProgressComplaints}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Resolved
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {resolvedComplaints}
            </p>
          </div>
        </div>
                {/* Society Notices */}
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Society Notices
            </h2>

            <Link
              href="/resident/notices"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              View all →
            </Link>
          </div>

          {notices.length === 0 ? (
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500">
                No society notices yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {notices.map((notice) => (
                <div
                  key={notice.id}
                  className="rounded-xl bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {notice.title}
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        {notice.type}
                      </p>
                    </div>

                    {notice.isImportant && (
                      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                        IMPORTANT
                      </span>
                    )}
                  </div>

                  <p className="mt-3 text-sm text-gray-700">
                    {notice.content}
                  </p>

                  <p className="mt-3 text-xs text-gray-400">
                    Posted{" "}
                    {notice.createdAt.toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent complaints */}
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              My Recent Complaints
            </h2>

            <Link
              href="/resident/complaints"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              View all →
            </Link>
          </div>

          {complaints.length === 0 ? (
            <div className="rounded-xl bg-white p-8 text-center shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">
                No complaints yet
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                You haven't submitted any complaints yet.
              </p>

              <Link
                href="/resident/complaints"
                className="mt-5 inline-block rounded-lg bg-black px-5 py-3 text-sm font-medium text-white hover:bg-gray-800"
              >
                Submit a Complaint
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {complaints.slice(0, 5).map((complaint) => (
                <Link
                  key={complaint.id}
                  href={`/resident/complaints/${complaint.id}`}
                  className="block rounded-xl bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {complaint.title}
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        {complaint.category}
                      </p>

                      <p className="mt-2 text-sm text-gray-600">
                        📍 {complaint.location.name}
                        {complaint.location.block
                          ? ` • Block ${complaint.location.block}`
                          : ""}
                        {complaint.location.floor
                          ? ` • Floor ${complaint.location.floor}`
                          : ""}
                      </p>

                      <p className="mt-2 text-xs text-gray-400">
                        Submitted{" "}
                        {complaint.createdAt.toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          statusStyles[complaint.status] ??
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {complaint.status.replace("_", " ")}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          priorityStyles[complaint.priorityLabel] ??
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {complaint.priorityLabel}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}