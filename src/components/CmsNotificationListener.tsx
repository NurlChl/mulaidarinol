"use client";

import { useEffect, useState } from "react";
import { Bell, X, Info, ShieldCheck, Sparkles } from "lucide-react";

interface NotificationMsg {
  id: string;
  type: string;
  title: string;
  message: string;
}

export function CmsNotificationListener() {
  const [notifications, setNotifications] = useState<NotificationMsg[]>([]);

  useEffect(() => {
    // Establish connection to Server-Sent Events endpoint
    const eventSource = new EventSource("/api/cms/notifications");

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Ignore heartbeats / handshakes
        if (data.type === "handshake" || data.type === "connected") {
          return;
        }

        // Map SSE notifications to UI message cards
        let title = "Notifikasi Sistem";
        let message = "Aktivitas baru tercatat.";

        if (data.type === "partner-applied") {
          title = "Pendaftaran Partner Baru";
          message = `${data.name} (${data.email}) telah mengajukan diri sebagai kontributor partner.`;
        } else if (data.type === "roadmap-saved") {
          title = "Roadmap Disimpan";
          message = `Roadmap "${data.title}" berhasil diperbarui di database.`;
        } else if (data.type === "partner-review") {
          title = "Review Partner Selesai";
          message = `Status pengajuan partner telah diubah menjadi ${data.action.toUpperCase()}.`;
        }

        const newNotification: NotificationMsg = {
          id: `${Date.now()}-${Math.random()}`,
          type: data.type,
          title,
          message,
        };

        setNotifications((prev) => [newNotification, ...prev]);

        // Auto remove notification after 6 seconds
        setTimeout(() => {
          setNotifications((prev) => prev.filter((n) => n.id !== newNotification.id));
        }, 6000);
      } catch (err) {
        console.error("SSE parse error:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("EventSource connection error:", err);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const handleDismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 w-full max-w-sm">
      {notifications.map((n) => (
        <div
          key={n.id}
          className="p-4 rounded-lg bg-card border border-border shadow-lg flex items-start gap-3 animate-in slide-in-from-bottom-4 duration-300 relative text-xs"
        >
          <div className="shrink-0 mt-0.5">
            {n.type === "partner-applied" && <Bell className="h-4 w-4 text-amber-500" />}
            {n.type === "roadmap-saved" && <Sparkles className="h-4 w-4 text-indigo-500" />}
            {n.type === "partner-review" && <ShieldCheck className="h-4 w-4 text-emerald-500" />}
            {n.type !== "partner-applied" && n.type !== "roadmap-saved" && n.type !== "partner-review" && (
              <Info className="h-4 w-4 text-primary" />
            )}
          </div>

          <div className="flex-1 pr-6 text-left">
            <h4 className="font-bold text-foreground">{n.title}</h4>
            <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
              {n.message}
            </p>
          </div>

          <button
            onClick={() => handleDismiss(n.id)}
            className="absolute top-3 right-3 p-0.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

export default CmsNotificationListener;
