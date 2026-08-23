"use client";

import { useState } from "react";

type CommentFormProps = {
  complaintId: string;
};

export default function CommentForm({
  complaintId,
}: CommentFormProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        "/api/admin/complaints/comment",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            complaintId,
            content,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.error ?? "Failed to add comment.",
        );
        return;
      }

      setContent("");
      setMessage("Comment added successfully.");

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
          htmlFor="comment"
          className="block text-sm font-medium text-gray-700"
        >
          Add a comment
        </label>

        <textarea
          id="comment"
          value={content}
          onChange={(event) =>
            setContent(event.target.value)
          }
          rows={4}
          placeholder="Write an update or comment..."
          className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !content.trim()}
        className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Adding..." : "Add Comment"}
      </button>

      {message && (
        <p className="text-sm text-gray-600">
          {message}
        </p>
      )}
    </form>
  );
}