"use client";

import { useState } from "react";

type AssignmentFormProps = {
  complaintId: string;
  currentAssigneeId: string | null;
  users: {
    id: string;
    name: string;
    email: string;
  }[];
};

export default function AssignmentForm({
  complaintId,
  currentAssigneeId,
  users,
}: AssignmentFormProps) {
  const [assigneeId, setAssigneeId] = useState(
    currentAssigneeId ?? "",
  );

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/complaints/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          complaintId,
          assigneeId: assigneeId || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error ?? "Failed to assign complaint.");
        return;
      }

      setMessage("Assignment updated successfully.");

      window.location.reload();
    } catch {
      setMessage("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div>
        <label
          htmlFor="assignee"
          className="block text-sm font-medium text-gray-700"
        >
          Assign to
        </label>

        <select
          id="assignee"
          value={assigneeId}
          onChange={(event) => setAssigneeId(event.target.value)}
          className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">Unassigned</option>

          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.email})
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save Assignment"}
      </button>

      {message && (
        <p className="text-sm text-gray-600">
          {message}
        </p>
      )}
    </form>
  );
}