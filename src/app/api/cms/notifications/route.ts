import { auth } from "@/lib/auth";
import notificationEmitter from "@/lib/emitter";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  
  if (!session || session.user.role === "user") {
    return new Response("Unauthorized", { status: 401 });
  }

  let onNotification: (data: any) => void;

  const responseStream = new ReadableStream({
    start(controller) {
      onNotification = (data: any) => {
        try {
          controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
        } catch (err) {
          // If controller is closed, remove event listener to prevent leak
          notificationEmitter.off("notification", onNotification);
        }
      };

      // Add listener to global emitter
      notificationEmitter.on("notification", onNotification);

      // Send connection established handshake
      controller.enqueue(`data: ${JSON.stringify({ type: "handshake", status: "connected" })}\n\n`);
    },
    cancel() {
      // Clean up event listener when connection terminates
      if (onNotification) {
        notificationEmitter.off("notification", onNotification);
      }
    },
  });

  return new Response(responseStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}
