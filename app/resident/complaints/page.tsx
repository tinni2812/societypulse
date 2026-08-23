import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";
import { authOptions } from "../../../lib/auth";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

export default async function ResidentComplaintsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "RESIDENT") {
    redirect("/admin/dashboard");
  }

  const resident = await prisma.user.findUnique({
    where: {
      email: session.user.email!,
    },
    select: {
      id: true,
      societyId: true,
      name: true,
    },
  });

  if (!resident) {
    redirect("/login");
  }

  const complaints = await prisma.complaint.findMany({
    where: {
      reporterId: resident.id,
      societyId: resident.societyId,
    },
    select: {
      id: true,
      title: true,
      category: true,
      priorityLabel: true,
      status: true,
      dueAt: true,
      createdAt: true,
      location: {
        select: {
          name: true,
          block: true,
          floor: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const now = new Date();

  return (
    <main className="min-h-screen bg-gray-100 p-8 text-gray-900">
      <div className="mx-auto max-w-5xl">
        <div>
          <a
            href="/resident/dashboard"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            ← Back to Dashboard
          </a>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
  <div>
    <h1 className="text-3xl font-bold">
      My Complaints
    </h1>

    <p className="mt-2 text-gray-600">
      View and track your submitted complaints.
    </p>
  </div>

  <Link
    href="/resident/complaints/new"
    className="inline-flex items-center justify-center rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
  >
    + New Complaint
  </Link>
</div>

          
        </div>

        <div className="mt-8 space-y-4">
          {complaints.map((complaint) => (
            <a
              key={complaint.id}
              href={`/resident/complaints/${complaint.id}`}
              className="block rounded-xl bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">
                    {complaint.title}
                  </h2>

                  <p className="mt-2 text-sm text-gray-600">
                    {complaint.category}
                  </p>

                  <p className="mt-1 text-sm text-gray-600">
                    {complaint.location.name}
                    {complaint.location.block
                      ? ` • Block ${complaint.location.block}`
                      : ""}
                    {complaint.location.floor
                      ? ` • Floor ${complaint.location.floor}`
                      : ""}
                  </p>

                  <p className="mt-2 text-xs text-gray-500">
                    Submitted{" "}
                    {complaint.createdAt.toLocaleString()}
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
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {complaint.status === "RESOLVED" ||
                      complaint.status === "CLOSED"
                        ? "SLA COMPLETED"
                        : complaint.dueAt < now
                          ? "SLA OVERDUE"
                          : "SLA ACTIVE"}
                    </span>
                  )}
                </div>
              </div>
            </a>
          ))}

          {complaints.length === 0 && (
            <div className="rounded-xl bg-white p-8 text-center shadow-sm">
              <p className="text-gray-600">
                You have not submitted any complaints yet.
              </p>

              <a
                href="/resident/complaints/new"
                className="mt-4 inline-block rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white"
              >
                Submit a Complaint
              </a>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}