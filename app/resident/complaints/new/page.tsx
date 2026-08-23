"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Location = {
  id: string;
  name: string;
  block: string | null;
  floor: string | null;
};

export default function NewComplaintPage() {
  const router = useRouter();

  const [locations, setLocations] = useState<Location[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [severity, setSeverity] = useState("3");
  const [locationId, setLocationId] = useState("");

  useEffect(() => {
    async function loadLocations() {
      try {
        const response = await fetch("/api/locations");

        if (!response.ok) {
          throw new Error("Unable to load locations.");
        }

        const data = await response.json();
        setLocations(data.locations ?? []);
      } catch (err) {
        console.error(err);
        setError("Unable to load society locations.");
      } finally {
        setLoadingLocations(false);
      }
    }

    loadLocations();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/complaints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          category,
          severity: Number(severity),
          locationId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Unable to create complaint.");
        return;
      }

      setSuccess("Complaint submitted successfully.");

      setTitle("");
      setDescription("");
      setCategory("");
      setSeverity("3");
      setLocationId("");

      setTimeout(() => {
        router.push("/resident/dashboard");
      }, 1000);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <button
            type="button"
            onClick={() => router.push("/resident/dashboard")}
            className="mb-4 text-sm font-medium text-blue-600 hover:underline"
          >
            ← Back to Dashboard
          </button>

          <h1 className="text-3xl font-bold text-gray-900">
            Submit a Complaint
          </h1>

          <p className="mt-2 text-gray-600">
            Tell your society management what needs attention.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl bg-white p-8 shadow"
        >
          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700">
              {success}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-800">
              Complaint Title
            </label>

            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Water leakage near staircase"
              required
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800">
              Description
            </label>

            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the issue in detail..."
              required
              rows={5}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800">
              Category
            </label>

            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              required
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Select a category</option>
              <option value="WATER">Water</option>
              <option value="ELECTRICITY">Electricity</option>
              <option value="LIFT">Lift</option>
              <option value="CLEANLINESS">Cleanliness</option>
              <option value="SECURITY">Security</option>
              <option value="PLUMBING">Plumbing</option>
              <option value="MAINTENANCE">General Maintenance</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800">
              Severity
            </label>

            <select
              value={severity}
              onChange={(event) => setSeverity(event.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            >
              <option value="1">1 — Low</option>
              <option value="2">2 — Minor</option>
              <option value="3">3 — Moderate</option>
              <option value="4">4 — Serious</option>
              <option value="5">5 — Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800">
              Location
            </label>

            <select
              value={locationId}
              onChange={(event) => setLocationId(event.target.value)}
              required
              disabled={loadingLocations}
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
            >
              <option value="">
                {loadingLocations
                  ? "Loading locations..."
                  : "Select a location"}
              </option>

              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting || loadingLocations}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Submit Complaint"}
          </button>
        </form>
      </div>
    </main>
  );
}