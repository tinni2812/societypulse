import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../generated/prisma/client";
import { authOptions } from "../../../../lib/auth";
import StatusUpdateForm from "./StatusUpdateForm";
import AssignmentForm from "./AssignmentForm";
import CommentForm from "./CommentForm";
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ComplaintDetailsPage({
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
      id: true,
      societyId: true,
      name: true,
    },
  });

  if (!admin) {
    redirect("/login");
  }
  const users = await prisma.user.findMany({
    where: {
      societyId: admin.societyId,
      role: "ADMIN",
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  const complaint = await prisma.complaint.findFirst({
    where: {
      id,
      societyId: admin.societyId,
    },
    include: {
      reporter: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      location: {
        select: {
          id: true,
          name: true,
          block: true,
          floor: true,
          description: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
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
      sla: {
        select: {
          id: true,
          name: true,
          category: true,
          priorityLabel: true,
          resolutionHours: true,
        },
      },
      satisfactionRating: {
        select: {
          score: true,
          comment: true,
        },
      },
      statusHistory: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          changedBy: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
      comments: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          author: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!complaint) {
    notFound();
  }
  const admins = await prisma.user.findMany({
  where: {
    societyId: admin.societyId,
    role: "ADMIN",
  },
  select: {
    id: true,
    name: true,
    email: true,
  },
  orderBy: {
    name: "asc",
  },
});

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
            {complaint.title}
          </h1>

          <p className="mt-2 text-gray-600">
            Complaint ID: {complaint.id}
          </p>
          <div className="mt-4">
  <a
    href={`/admin/complaints/${complaint.id}/edit`}
    className="inline-flex items-center rounded-lg bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
  >
    Edit Complaint
  </a>
</div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">
              Complaint Details
            </h2>

            <p className="mt-4 text-gray-700">
              {complaint.description}
            </p>

            <div className="mt-6 space-y-3 text-sm">
              <p>
                <strong>Category:</strong> {complaint.category}
              </p>

              <p>
                <strong>Severity:</strong> {complaint.severity}/5
              </p>

              <p>
                <strong>Priority:</strong> {complaint.priorityLabel}
              </p>

              <p>
                <strong>Status:</strong> {complaint.status}
              </p>

              <p>
                <strong>Affected residents:</strong>{" "}
{complaint.affectedResidentsEstimated}
              </p>
            </div>
          </section>

          <section className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">
              Location
            </h2>

            <div className="mt-4 space-y-2 text-gray-700">
              <p>
                <strong>{complaint.location.name}</strong>
              </p>

              <p>Block: {complaint.location.block ?? "N/A"}</p>

              <p>Floor: {complaint.location.floor ?? "N/A"}</p>

              {complaint.location.description && (
                <p>{complaint.location.description}</p>
              )}
            </div>
          </section>

          <section className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">
              Reported By
            </h2>

            <div className="mt-4 space-y-2 text-gray-700">
              <p>
                <strong>{complaint.reporter.name}</strong>
              </p>

              <p>{complaint.reporter.email}</p>
            </div>
          </section>

          <section className="rounded-xl bg-white p-6 shadow-sm">
  <h2 className="text-xl font-semibold">
    Assignment
  </h2>

  <AssignmentForm
    complaintId={complaint.id}
    currentAssigneeId={complaint.assignedTo?.id ?? null}
    users={users}
  />
</section>
        </div>
        <div className="mt-6">
          <StatusUpdateForm
            complaintId={complaint.id}
            currentStatus={complaint.status}
          />
        </div>

        {complaint.group && (
          <section className="mt-6 rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">
              Complaint Group
            </h2>

            <div className="mt-4 space-y-2 text-gray-700">
              <p>
                <strong>{complaint.group.name}</strong>
              </p>

              <p>Category: {complaint.group.category}</p>

              <p>
                Complaints in group:{" "}
                {complaint.group.complaintCount}
              </p>

              <p>
                Affected residents:{" "}
                {complaint.group.affectedResidents}
              </p>
            </div>
          </section>
        )}

        {complaint.sla && (
          <section className="mt-6 rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">
              SLA
            </h2>

            <div className="mt-4 space-y-2 text-gray-700">
              <p>
                <strong>{complaint.sla.name}</strong>
              </p>

              <p>
                Resolution target:{" "}
                {complaint.sla.resolutionHours} hours
              </p>

              {complaint.dueAt && (
                <p>
                  Due: {complaint.dueAt.toLocaleString()}
                </p>
              )}
            </div>
          </section>
        )}

        <section className="mt-6 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">
            Status History
          </h2>

          <div className="mt-4 space-y-4">
            {complaint.statusHistory.length === 0 ? (
              <p className="text-gray-600">
                No status history yet.
              </p>
            ) : (
              complaint.statusHistory.map((history) => (
                <div
                  key={history.id}
                  className="border-l-2 border-gray-300 pl-4"
                >
                  <p className="font-semibold">
                    {history.status}
                  </p>

                  {history.note && (
                    <p className="text-sm text-gray-600">
                      {history.note}
                    </p>
                  )}

                  <p className="text-xs text-gray-500">
                    {history.changedBy.name} •{" "}
                    {history.createdAt.toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="mt-6 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">
            Comments
          </h2>
          <CommentForm complaintId={complaint.id} />

          <div className="mt-4 space-y-4">
            {complaint.comments.length === 0 ? (
              <p className="text-gray-600">
                No comments yet.
              </p>
            ) : (
              complaint.comments.map((comment) => (
                <div
                  key={comment.id}
                  className="rounded-lg bg-gray-50 p-4"
                >
                  <p className="text-gray-800">
                    {comment.content}
                  </p>

                  <p className="mt-2 text-xs text-gray-500">
                    {comment.author.name} •{" "}
                    {comment.createdAt.toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        {complaint.satisfactionRating && (
          <section className="mt-6 rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">
              Satisfaction Rating
            </h2>

            <p className="mt-4 text-2xl font-bold">
              {complaint.satisfactionRating.score}/5
            </p>

            {complaint.satisfactionRating.comment && (
              <p className="mt-2 text-gray-700">
                {complaint.satisfactionRating.comment}
              </p>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
