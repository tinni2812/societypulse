import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../../generated/prisma/client";
import { authOptions } from "../../../../../lib/auth";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditComplaintPage({
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
    },
  });

  if (!admin) {
    redirect("/login");
  }

  const complaint = await prisma.complaint.findFirst({
    where: {
      id,
      societyId: admin.societyId,
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

  if (!complaint) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8 text-gray-900">
      <div className="mx-auto max-w-3xl">
        <a
          href={`/admin/complaints/${complaint.id}`}
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          ← Back to Complaint
        </a>

        <div className="mt-6 rounded-xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold">
            Edit Complaint
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Update the complaint information below.
          </p>

          <form
            action={`/api/admin/complaints/${complaint.id}`}
            method="POST"
            className="mt-6 space-y-5"
          >
            <div>
              <label
                htmlFor="title"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Title
              </label>

              <input
                id="title"
                name="title"
                type="text"
                required
                defaultValue={complaint.title}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Description
              </label>

              <textarea
                id="description"
                name="description"
                required
                rows={6}
                defaultValue={complaint.description}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
              />
            </div>

            <div>
              <label
                htmlFor="category"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Category
              </label>

              <input
                id="category"
                name="category"
                type="text"
                required
                defaultValue={complaint.category}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
              />
            </div>

            <div>
              <label
                htmlFor="severity"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Severity
              </label>

              <input
                id="severity"
                name="severity"
                type="number"
                min="1"
                max="5"
                required
                defaultValue={complaint.severity}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
              />
            </div>

            <div>
              <label
                htmlFor="priorityLabel"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Priority
              </label>

              <select
                id="priorityLabel"
                name="priorityLabel"
                defaultValue={complaint.priorityLabel}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-gray-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="affectedResidentsEstimated"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Estimated Affected Residents
              </label>

              <input
                id="affectedResidentsEstimated"
                name="affectedResidentsEstimated"
                type="number"
                min="0"
                defaultValue={
                  complaint.affectedResidentsEstimated ?? 0
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
              />
            </div>
            <div>
  <label
    htmlFor="affectedResidentsVerified"
    className="mb-2 block text-sm font-medium text-gray-700"
  >
    Verified Affected Residents
  </label>

  <input
    id="affectedResidentsVerified"
    name="affectedResidentsVerified"
    type="number"
    min="0"
    defaultValue={
      complaint.affectedResidentsVerified ?? ""
    }
    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
  />

  <p className="mt-1 text-xs text-gray-500">
    Enter the number confirmed by the administration.
  </p>
</div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                Save Changes
              </button>

              <a
                href={`/admin/complaints/${complaint.id}`}
                className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </a>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}