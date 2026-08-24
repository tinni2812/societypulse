"use client";

import { FormEvent, useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setLoading(false);
      setError("Invalid email or password.");
      return;
    }

    const session = await getSession();

    setLoading(false);

    if (session?.user?.role === "ADMIN") {
      router.push("/admin/dashboard");
      router.refresh();
      return;
    }

    if (session?.user?.role === "RESIDENT") {
      router.push("/resident/dashboard");
      router.refresh();
      return;
    }

    setError("Unable to determine user role.");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
  
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg dark:bg-gray-900">
        <div className="mb-8 text-center">
          <img
  src="/branding/societypulse-icon-square.svg"
  alt="SocietyPulse"
  className="mx-auto h-16 w-16"
/>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Sign in to manage your society
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-black px-4 py-3 font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
  Don't have an account?{" "}
  <Link
    href="/register"
    className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
  >
    Create an account
  </Link>
</div>
      </div>
    </main>
  );
}