"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const statuses = [
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
] as const;

type Status = (typeof statuses)[number];

type Props = {
  complaintId: string;
  currentStatus: Status;
};

export default function StatusUpdateForm({
  complaintId,
  currentStatus,
}: Props) {
  const router = useRouter();

  const [status, setStatus] = useState<Status>(currentStatus);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `/api/admin/complaints/${complaintId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
            note,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to update status.");
        return;
      }

      setMessage("Complaint status updated successfully.");
      setNote("");

      router.refresh();
    } catch {
      setError("Something went wrong while updating the status.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900">
        Update Status
      </h2>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label
            htmlFor="status"
            className="block text-sm font-medium text-gray-700"
          >
            Complaint Status
          </label>

          <select
            id="status"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as Status)
            }
            disabled={loading}
            className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-gray-500 focus:outline-none"
          >
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="note"
            className="block text-sm font-medium text-gray-700"
          >
            Note
          </label>

          <textarea
            id="note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            disabled={loading}
            rows={3}
            placeholder="Optional status update note..."
            className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500 focus:border-gray-500 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading || status === currentStatus}
          className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Updating..." : "Update Status"}
        </button>

        {message && (
          <p className="text-sm font-medium text-green-700">
            {message}
          </p>
        )}

        {error && (
          <p className="text-sm font-medium text-red-700">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}