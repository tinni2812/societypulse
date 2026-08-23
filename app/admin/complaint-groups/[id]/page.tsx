import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../generated/prisma/client";
import { authOptions } from "../../../../lib/auth";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ComplaintGroupPage({
  params,
}: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/resident/dashboard");
  }

  const { id } = await params;

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

  const group = await prisma.complaintGroup.findFirst({
    where: {
      id,
      societyId: admin.societyId,
    },
    include: {
      complaints: {
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          title: true,
          category: true,
          status: true,
          priorityLabel: true,
          severity: true,
          createdAt: true,
          location: {
            select: {
              name: true,
              block: true,
              floor: true,
            },
          },
        },
      },
    },
  });

  if (!group) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8 text-gray-900">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <a
            href="/admin/dashboard"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            ← Back to Admin Dashboard
          </a>

          <h1 className="mt-4 text-3xl font-bold">
            {group.name}
          </h1>

          <p className="mt-2 text-gray-600">
            Complaint Group
          </p>
        </div>

        {/* Group Overview */}
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">
            Group Overview
          </h2>

          {group.description && (
            <p className="mt-4 text-gray-700">
              {group.description}
            </p>
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-600">
                Category
              </p>

              <p className="mt-1 text-lg font-semibold">
                {group.category}
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-600">
                Complaints
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {group.complaintCount}
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-600">
                Affected Residents
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {group.affectedResidents}
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-600">
                Status
              </p>

              <p className="mt-1 text-lg font-semibold">
                {group.isActive ? "ACTIVE" : "INACTIVE"}
              </p>
            </div>
          </div>
        </section>

        {/* Detection Information */}
        <section className="mt-6 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">
            Group Timeline
          </h2>

          <div className="mt-4 space-y-2 text-gray-700">
            <p>
              <strong>First detected:</strong>{" "}
              {group.firstDetectedAt.toLocaleString()}
            </p>

            <p>
              <strong>Last updated:</strong>{" "}
              {group.lastUpdatedAt.toLocaleString()}
            </p>
          </div>
        </section>

        {/* Group Complaints */}
        <section className="mt-6 rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Complaints in This Group
            </h2>

            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold">
              {group.complaints.length}
            </span>
          </div>

          <div className="mt-6 space-y-4">
            {group.complaints.length === 0 ? (
              <p className="text-sm text-gray-600">
                No complaints belong to this group yet.
              </p>
            ) : (
              group.complaints.map((complaint) => (
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

                      <p className="mt-1 text-xs text-gray-500">
                        Created{" "}
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
                    </div>
                  </div>
                </a>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}