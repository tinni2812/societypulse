import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";
import { authOptions } from "../../../lib/auth";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

export default async function ResidentNoticesPage() {
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
      societyId: true,
    },
  });

  if (!resident) {
    redirect("/login");
  }

  const notices = await prisma.notice.findMany({
    where: {
      societyId: resident.societyId,
    },
    select: {
      id: true,
      title: true,
      content: true,
      type: true,
      isImportant: true,
      createdAt: true,
      author: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="min-h-screen bg-gray-100 p-8 text-gray-900">
      <div className="mx-auto max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold">
            Society Notices
          </h1>

          <p className="mt-2 text-gray-600">
            Important announcements and updates from your society.
          </p>
        </div>

        <div className="mt-8 space-y-5">
          {notices.map((notice) => (
            <div
              key={notice.id}
              className={`rounded-xl bg-white p-6 shadow-sm ${
                notice.isImportant
                  ? "border-l-4 border-red-500"
                  : ""
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold">
                      {notice.title}
                    </h2>

                    {notice.isImportant && (
                      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                        IMPORTANT
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-gray-100 px-3 py-1 font-semibold text-gray-700">
                      {notice.type}
                    </span>

                    <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-600">
                      {notice.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <p className="mt-5 whitespace-pre-wrap text-gray-700">
                {notice.content}
              </p>

              <p className="mt-5 text-xs text-gray-500">
                Posted by {notice.author.name}
              </p>
            </div>
          ))}

          {notices.length === 0 && (
            <div className="rounded-xl bg-white p-8 text-center shadow-sm">
              <p className="text-gray-600">
                No notices have been posted yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}