import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Not authenticated</h1>
          <p className="mt-2 text-gray-500">
            Please log in to access the dashboard.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold">SocietyPulse Dashboard</h1>

        <div className="mt-8 rounded-2xl bg-white p-6 shadow">
          <h2 className="text-xl font-semibold">Authenticated User</h2>

          <div className="mt-4 space-y-2">
            <p>
              <strong>Name:</strong> {session.user.name}
            </p>

            <p>
              <strong>Email:</strong> {session.user.email}
            </p>

            <p>
              <strong>User ID:</strong> {session.user.id}
            </p>

            <p>
              <strong>Role:</strong> {session.user.role}
            </p>

            <p>
              <strong>Society ID:</strong> {session.user.societyId}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}