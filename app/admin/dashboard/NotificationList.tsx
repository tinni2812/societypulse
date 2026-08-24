"use client";

import { useState } from "react";
import NotificationItem from "./NotificationItem";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
};

type Props = {
  notifications: Notification[];
};

export default function NotificationList({
  notifications,
}: Props) {
  const [showRead, setShowRead] = useState(false);

  const unreadNotifications = notifications.filter(
    (notification) => !notification.isRead,
  );

  const readNotifications = notifications.filter(
    (notification) => notification.isRead,
  );

  return (
    <div className="mt-4 space-y-3">
      {unreadNotifications.map((notification) => (
        <div
          key={notification.id}
          className="rounded-lg border border-blue-200 bg-blue-50 p-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-medium text-gray-900">
                {notification.title}
              </p>

              <p className="mt-1 text-sm text-gray-600">
                {notification.message}
              </p>

              <p className="mt-2 text-xs text-gray-500">
                {notification.createdAt.toISOString().replace("T", " ").slice(0, 19)}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <span className="rounded-full bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white">
                New
              </span>

              <NotificationItem
                notificationId={notification.id}
                isRead={notification.isRead}
              />
            </div>
          </div>
        </div>
      ))}

      {readNotifications.length > 0 && (
        <button
          type="button"
          onClick={() => setShowRead((current) => !current)}
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          {showRead
            ? "Hide read notifications"
            : `View ${readNotifications.length} read ${
                readNotifications.length === 1
                  ? "notification"
                  : "notifications"
              }`}
        </button>
      )}

      {showRead &&
        readNotifications.map((notification) => (
          <div
            key={notification.id}
            className="rounded-lg border border-gray-200 bg-gray-50 p-4"
          >
            <p className="font-medium text-gray-800">
              {notification.title}
            </p>

            <p className="mt-1 text-sm text-gray-600">
              {notification.message}
            </p>

            <p className="mt-2 text-xs text-gray-500">
              {notification.createdAt.toISOString().replace("T", " ").slice(0, 19)}
            </p>
          </div>
        ))}

      {notifications.length === 0 && (
        <p className="text-sm text-gray-600">
          No notifications yet.
        </p>
      )}
    </div>
  );
}