"use client";

import { useState } from "react";

type RatingFormProps = {
  complaintId: string;
};

export default function RatingForm({
  complaintId,
}: RatingFormProps) {
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState("");
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
        "/api/resident/complaints/rating",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            complaintId,
            score,
            comment,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.error ?? "Failed to submit rating.",
        );
        return;
      }

      setMessage("Rating submitted successfully.");

      window.location.reload();
    } catch {
      setMessage("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 space-y-4"
    >
      <div>
        <label
          htmlFor="score"
          className="block text-sm font-medium text-gray-700"
        >
          Rating
        </label>

        <select
          id="score"
          value={score}
          onChange={(event) =>
            setScore(Number(event.target.value))
          }
          className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value={5}>5 — Excellent</option>
          <option value={4}>4 — Good</option>
          <option value={3}>3 — Average</option>
          <option value={2}>2 — Poor</option>
          <option value={1}>1 — Very Poor</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="comment"
          className="block text-sm font-medium text-gray-700"
        >
          Feedback
        </label>

        <textarea
          id="comment"
          value={comment}
          onChange={(event) =>
            setComment(event.target.value)
          }
          rows={4}
          placeholder="Tell us about your experience..."
          className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Submit Rating"}
      </button>

      {message && (
        <p className="text-sm text-gray-600">
          {message}
        </p>
      )}
    </form>
  );
}