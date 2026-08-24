import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../generated/prisma/client";
import { authOptions } from "../../../../lib/auth";
import RatingForm from "./RatingForm";
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

export default async function ResidentComplaintDetailsPage({
  params,
}: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "RESIDENT") {
    redirect("/admin/dashboard");
  }

  const { id } = await params;

  const resident = await prisma.user.findUnique({
    where: {
      email: session.user.email!,
    },
    select: {
      id: true,
      societyId: true,
    },
  });

  if (!resident) {
    redirect("/login");
  }

  const complaint = await prisma.complaint.findFirst({
    where: {
      id,
      reporterId: resident.id,
      societyId: resident.societyId,
    },
    include: {
      location: {
        select: {
          name: true,
          block: true,
          floor: true,
        },
      },
      assignedTo: {
        select: {
          name: true,
          email: true,
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
              role: true,
            },
          },
        },
      },
      satisfactionRating: {
        select: {
          score: true,
          comment: true,
        },
      },
    },
  });

  if (!complaint) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8 text-gray-900">
      <div className="mx-auto max-w-4xl">

        <a
          href="/resident/dashboard"
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          ← Back to Dashboard
        </a>

        <div className="mt-4">
          <h1 className="text-3xl font-bold">
            {complaint.title}
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Complaint ID: {complaint.id}
          </p>
        </div>

        {/* Complaint Details */}
        <section className="mt-6 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">
            Complaint Details
          </h2>

          <p className="mt-4 text-gray-700">
            {complaint.description}
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">
                Category
              </p>
              <p className="font-medium">
                {complaint.category}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Priority
              </p>
              <p className="font-medium">
                {complaint.priorityLabel}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Status
              </p>
              <p className="font-medium">
                {complaint.status}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Severity
              </p>
              <p className="font-medium">
                {complaint.severity}/5
              </p>
            </div>
          </div>
        </section>

        {/* Location */}
        <section className="mt-6 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">
            Location
          </h2>

          <div className="mt-4 space-y-2 text-gray-700">
            <p className="font-medium">
              {complaint.location.name}
            </p>

            <p>
              Block: {complaint.location.block ?? "N/A"}
            </p>

            <p>
              Floor: {complaint.location.floor ?? "N/A"}
            </p>
          </div>
        </section>

        {/* Assignment */}
        <section className="mt-6 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">
            Assigned To
          </h2>

          <div className="mt-4 text-gray-700">
            {complaint.assignedTo ? (
              <>
                <p className="font-medium">
                  {complaint.assignedTo.name}
                </p>

                <p className="text-sm">
                  {complaint.assignedTo.email}
                </p>
              </>
            ) : (
              <p>Not assigned yet.</p>
            )}
          </div>
        </section>
        {/* SLA Information */}
<section className="mt-6 rounded-xl bg-white p-6 shadow-sm">
  <h2 className="text-xl font-semibold">
    Resolution Timeline
  </h2>

  <div className="mt-4 grid gap-4 sm:grid-cols-2">
    <div>
      <p className="text-sm text-gray-500">
        Expected Resolution
      </p>

      <p className="mt-1 font-medium">
        {complaint.dueAt
          ? complaint.dueAt.toLocaleString()
          : "Not assigned yet"}
      </p>
    </div>

    <div>
      <p className="text-sm text-gray-500">
        SLA Status
      </p>

      <p
        className={`mt-1 font-medium ${
          complaint.status === "RESOLVED" ||
          complaint.status === "CLOSED"
            ? "text-green-600"
            : complaint.dueAt &&
                complaint.dueAt < new Date()
              ? "text-red-600"
              : complaint.dueAt &&
                  complaint.dueAt.getTime() -
                    new Date().getTime() <=
                    24 * 60 * 60 * 1000
                ? "text-yellow-600"
                : "text-green-600"
        }`}
      >
        {complaint.status === "RESOLVED" ||
        complaint.status === "CLOSED"
          ? "Completed"
          : complaint.dueAt &&
              complaint.dueAt < new Date()
            ? "Overdue"
            : complaint.dueAt &&
                complaint.dueAt.getTime() -
                  new Date().getTime() <=
                  24 * 60 * 60 * 1000
              ? "Due Soon"
              : complaint.dueAt
                ? "On Track"
                : "Not Assigned"}
      </p>
    </div>
  </div>
</section>

        {/* Status History */}
        <section className="mt-6 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">
            Status Updates
          </h2>

          <div className="mt-4 space-y-4">
            {complaint.statusHistory.length === 0 ? (
              <p className="text-gray-600">
                No status updates yet.
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
                    <p className="mt-1 text-sm text-gray-600">
                      {history.note}
                    </p>
                  )}

                  <p className="mt-1 text-xs text-gray-500">
                    {history.changedBy.name} •{" "}
                    {history.createdAt.toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Comments */}
        <section className="mt-6 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">
            Updates & Comments
          </h2>

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
          <CommentForm complaintId={complaint.id} />
        </section>

        {/* Satisfaction */}
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

{/* Submit Satisfaction Rating */}
{!complaint.satisfactionRating &&
  (complaint.status === "RESOLVED" ||
    complaint.status === "CLOSED") && (
    <section className="mt-6 rounded-xl bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">
        Rate Your Experience
      </h2>

      <p className="mt-2 text-sm text-gray-600">
        Your complaint has been resolved. Please rate the
        resolution and share your feedback.
      </p>

      <RatingForm complaintId={complaint.id} />
    </section>
  )}

      </div>
    </main>
  );
}