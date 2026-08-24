"use client";

import { useState } from "react";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

type Props = {
  notifications: Notification[];
};

export default function NotificationList({
  notifications,
}: Props) {
  const [items, setItems] = useState(notifications);

  function markAsRead(id: string) {
    setItems((current) =>
      current.map((notification) =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification,
      ),
    );
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Notifications
          </h2>

          <p className="mt-1 text-sm text-gray-600">
            Recent updates related to complaints and society activity.
          </p>
        </div>

        <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
          {items.filter((notification) => !notification.isRead).length} unread
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {items.length > 0 ? (
          items.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => markAsRead(notification.id)}
              className={`w-full rounded-lg p-4 text-left transition ${
                notification.isRead
                  ? "bg-gray-50"
                  : "bg-gray-100"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-gray-900">
                    {notification.title}
                  </p>

                  <p className="mt-1 text-sm text-gray-600">
                    {notification.message}
                  </p>
                </div>

                {!notification.isRead && (
                  <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-gray-900" />
                )}
              </div>

              <p className="mt-2 text-xs text-gray-500">
                {new Date(
                  notification.createdAt,
                ).toLocaleString()}
              </p>
            </button>
          ))
        ) : (
          <p className="text-sm text-gray-600">
            No notifications yet.
          </p>
        )}
      </div>
    </div>
  );
}