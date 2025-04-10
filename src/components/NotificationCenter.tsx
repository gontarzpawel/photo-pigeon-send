
import React, { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/authService";
import { Badge } from "@/components/ui/badge";

interface Notification {
  id: string;
  type: string;
  message: string;
  created_at: string;
  read: boolean;
}

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [unreadCount, setUnreadCount] = useState(0);
  const serverUrl = authService.getBaseUrl();

  // Function to fetch notifications
  const fetchNotifications = async () => {
    if (!authService.isLoggedIn() || !serverUrl) return;

    try {
      setLoading(true);
      const token = authService.getToken();
      const response = await fetch(`${serverUrl}/notifications`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setUnreadCount(data.notifications.filter((n: Notification) => !n.read).length);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Update user activity status
  const updateActivity = async () => {
    if (!authService.isLoggedIn() || !serverUrl) return;

    try {
      const token = authService.getToken();
      await fetch(`${serverUrl}/activity`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error("Error updating activity:", error);
    }
  };

  // Mark notifications as read
  const markAsRead = async (ids: string[]) => {
    if (!authService.isLoggedIn() || !serverUrl) return;

    try {
      const token = authService.getToken();
      const response = await fetch(`${serverUrl}/notifications/read`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notification_ids: ids }),
      });

      if (response.ok) {
        setNotifications(
          notifications.map((notification) => {
            if (ids.includes(notification.id)) {
              return { ...notification, read: true };
            }
            return notification;
          })
        );
        setUnreadCount(prev => prev - ids.length);
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  // User interaction detection for activity tracking
  useEffect(() => {
    const handleActivity = () => {
      updateActivity();
    };

    // Track user interactions
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    // Initial activity update
    updateActivity();

    // Set up polling for notifications
    const notificationInterval = setInterval(fetchNotifications, 30000); // Every 30 seconds

    return () => {
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      clearInterval(notificationInterval);
    };
  }, [serverUrl]);

  // Fetch notifications when component mounts and when authentication state changes
  useEffect(() => {
    if (authService.isLoggedIn()) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [authService.isLoggedIn()]);

  // When opening the popover, mark all as read
  useEffect(() => {
    if (open && unreadCount > 0) {
      const unreadIds = notifications
        .filter(notification => !notification.read)
        .map(notification => notification.id);
      
      if (unreadIds.length > 0) {
        markAsRead(unreadIds);
      }
    }
  }, [open]);

  // Don't show if not authenticated
  if (!authService.isLoggedIn()) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 px-1 min-w-5 h-5 flex items-center justify-center">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="p-4 border-b">
          <h4 className="text-sm font-semibold">Notifications</h4>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">No notifications</div>
          ) : (
            <ul className="divide-y">
              {notifications.map((notification) => (
                <li
                  key={notification.id}
                  className={`p-4 hover:bg-accent/50 ${
                    !notification.read ? "bg-accent/20" : ""
                  }`}
                >
                  <p className="text-sm">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter;
