"use client";

import { useState } from "react";

export default function NoticeForm() {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("GENERAL");
  const [content, setContent] = useState("");
  const [isImportant, setIsImportant] = useState(false);
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
      const response = await fetch("/api/admin/notices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          type,
          content,
          isImportant,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Failed to create notice.");
        return;
      }

      setMessage("Notice created successfully.");

      setTitle("");
      setType("GENERAL");
      setContent("");
      setIsImportant(false);
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 space-y-5"
    >
      <div>
        <label
          htmlFor="title"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Notice Title
        </label>

        <input
          id="title"
          type="text"
          required
          value={title}
          onChange={(event) =>
            setTitle(event.target.value)
          }
          placeholder="e.g. Water supply maintenance"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
        />
      </div>

      <div>
        <label
          htmlFor="type"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Notice Type
        </label>

        <select
          id="type"
          value={type}
          onChange={(event) =>
            setType(event.target.value)
          }
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-gray-500"
        >
          <option value="GENERAL">General</option>
          <option value="MAINTENANCE">Maintenance</option>
          <option value="EMERGENCY">Emergency</option>
          <option value="EVENT">Event</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="content"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Notice Content
        </label>

        <textarea
          id="content"
          required
          rows={6}
          value={content}
          onChange={(event) =>
            setContent(event.target.value)
          }
          placeholder="Write the announcement here..."
          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
        />
      </div>

      <div className="flex items-center gap-3">
        <input
          id="isImportant"
          type="checkbox"
          checked={isImportant}
          onChange={(event) =>
            setIsImportant(event.target.checked)
          }
          className="h-4 w-4 rounded border-gray-300"
        />

        <label
          htmlFor="isImportant"
          className="text-sm font-medium text-gray-700"
        >
          Mark as important
        </label>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {message && (
        <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Creating..." : "Create Notice"}
      </button>
    </form>
  );
}