"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

export default function AdminNoticesPage() {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("GENERAL");
  const [content, setContent] = useState("");
  const [isImportant, setIsImportant] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(
  null,
);
const [editingId, setEditingId] = useState<string | null>(
  null,
);
const [savingEdit, setSavingEdit] = useState(false);
    const [notices, setNotices] = useState<
    {
      id: string;
      title: string;
      content: string;
      type: string;
      isImportant: boolean;
      createdAt: string;
      author?: {
        name: string | null;
      };
    }[]
  >([]);
    useEffect(() => {
    async function fetchNotices() {
      try {
        const response = await fetch(
          "/api/admin/notices",
        );

        const data = await response.json();

        if (!response.ok) {
          setError(
            data.error ?? "Failed to load notices.",
          );
          return;
        }

        setNotices(data.notices ?? []);
      } catch {
        setError("Failed to load notices.");
      }
    }

    fetchNotices();
  }, []);
    async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this notice?",
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(id);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        "/api/admin/notices",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ?? "Failed to delete notice.",
        );
        return;
      }

      setNotices((currentNotices) =>
        currentNotices.filter(
          (notice) => notice.id !== id,
        ),
      );

      setMessage("Notice deleted successfully.");
    } catch {
      setError("Failed to delete notice.");
    } finally {
      setDeletingId(null);
    }
  }
    function handleEditStart(
    notice: (typeof notices)[number],
  ) {
    setEditingId(notice.id);
    setTitle(notice.title);
    setType(notice.type);
    setContent(notice.content);
    setIsImportant(notice.isImportant);

    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
  "/api/admin/notices",
  {
    method: editingId ? "PUT" : "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...(editingId ? { id: editingId } : {}),
      title,
      type,
      content,
      isImportant,
    }),
  },
);

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ?? "Failed to create notice.",
        );
        return;
      }

      setMessage(
  editingId
    ? "Notice updated successfully."
    : "Notice created successfully.",
);

const noticesResponse = await fetch(
  "/api/admin/notices",
);

const noticesData = await noticesResponse.json();

if (noticesResponse.ok) {
  setNotices(noticesData.notices ?? []);
}

setTitle("");
      setType("GENERAL");
      setContent("");
      setIsImportant(false);
      setEditingId(null);
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8 text-gray-900">
      <div className="mx-auto max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold">
            Society Notices
          </h1>

          <p className="mt-2 text-gray-600">
            Create and manage announcements for residents.
          </p>
        </div>

        <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">
  {editingId ? "Edit Notice" : "Create Notice"}
</h2>

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
                <option value="GENERAL">
                  General
                </option>

                <option value="MAINTENANCE">
                  Maintenance
                </option>

                <option value="EMERGENCY">
                  Emergency
                </option>

                <option value="EVENT">
                  Event
                </option>
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
              {loading
  ? editingId
    ? "Updating..."
    : "Creating..."
  : editingId
    ? "Update Notice"
    : "Create Notice"}
            </button>
          </form>
        </div>
        {/* Existing Notices */}
        <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Existing Notices
            </h2>

            <span className="text-sm text-gray-500">
              {notices.length} notice
              {notices.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="mt-6 space-y-4">
            {notices.length === 0 ? (
              <p className="text-sm text-gray-600">
                No notices have been created yet.
              </p>
            ) : (
              notices.map((notice) => (
                <div
                  key={notice.id}
                  className="rounded-lg border border-gray-200 p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {notice.title}
                      </h3>

                      <p className="mt-1 text-xs text-gray-500">
                        {notice.type} •{" "}
                        {new Date(
                          notice.createdAt,
                        ).toLocaleDateString()}
                      </p>
                    </div>

                    {notice.isImportant && (
                      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                        IMPORTANT
                      </span>
                    )}
                    <button
  type="button"
  onClick={() => handleEditStart(notice)}
  className="rounded-lg bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-200"
>
  Edit
</button>
                    <button
  type="button"
  onClick={() => handleDelete(notice.id)}
  disabled={deletingId === notice.id}
  className="rounded-lg bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50"
>
  {deletingId === notice.id
    ? "Deleting..."
    : "Delete"}
</button>
                  </div>

                  <p className="mt-3 text-sm text-gray-700">
                    {notice.content}
                  </p>

                  {notice.author?.name && (
                    <p className="mt-3 text-xs text-gray-500">
                      Posted by {notice.author.name}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}