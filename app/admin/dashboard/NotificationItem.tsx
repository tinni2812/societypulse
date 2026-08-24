"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  notificationId: string;
  isRead: boolean;
};

export default function NotificationItem({
  notificationId,
  isRead,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function markAsRead() {
    setLoading(true);

    try {
      const response = await fetch(
        `/api/admin/notifications/${notificationId}/read`,
        {
          method: "PATCH",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to mark notification as read.");
      }

      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  if (isRead) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={markAsRead}
      disabled={loading}
      className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? "Marking..." : "Mark as read"}
    </button>
  );
}