"use client";

import { useState } from "react";

type CommentFormProps = {
  complaintId: string;
};

export default function CommentForm({
  complaintId,
}: CommentFormProps) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const trimmedContent = content.trim();

    if (!trimmedContent) {
      setMessage("Comment cannot be empty.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch(
        "/api/resident/complaints/comment",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            complaintId,
            content: trimmedContent,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.error || "Failed to add comment.",
        );
        return;
      }

      setContent("");
      setMessage("Comment added successfully.");

      window.location.reload();
    } catch {
      setMessage("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 space-y-3"
    >
      <label
        htmlFor="resident-comment"
        className="block text-sm font-medium text-gray-700"
      >
        Add a comment
      </label>

      <textarea
        id="resident-comment"
        value={content}
        onChange={(event) =>
          setContent(event.target.value)
        }
        placeholder="Add an update or additional information..."
        rows={4}
        className="w-full rounded-lg border border-gray-300 p-3 text-sm outline-none focus:border-blue-500"
        disabled={submitting}
      />

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Adding..." : "Add Comment"}
      </button>

      {message && (
        <p className="text-sm text-gray-600">
          {message}
        </p>
      )}
    </form>
  );
}