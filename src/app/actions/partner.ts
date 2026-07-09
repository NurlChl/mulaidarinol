"use my-server-action"; // Next.js server action
"use server";

import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import PartnerApplication from "@/lib/models/PartnerApplication";
import User from "@/lib/models/User";
import notificationEmitter from "@/lib/emitter";

export async function submitPartnerApplication(formData: {
  portfolioUrl: string;
  experienceSummary: string;
}) {
  const session = await auth();

  if (!session || !session.user) {
    return { success: false, error: "You must be logged in to apply." };
  }

  const { portfolioUrl, experienceSummary } = formData;

  if (!portfolioUrl || !experienceSummary) {
    return { success: false, error: "Please fill in all fields." };
  }

  try {
    await dbConnect();

    // Check if the user already has a pending or approved application
    const existingApp = await PartnerApplication.findOne({ userId: session.user.id });

    if (existingApp) {
      if (existingApp.status === "approved") {
        return { success: false, error: "You are already an approved Partner." };
      }
      if (existingApp.status === "pending") {
        return { success: false, error: "Your application is already pending review." };
      }
      // If rejected, allow them to re-apply by updating the application
      existingApp.portfolioUrl = portfolioUrl;
      existingApp.experienceSummary = experienceSummary;
      existingApp.status = "pending";
      await existingApp.save();
    } else {
      // Create new application
      await PartnerApplication.create({
        userId: session.user.id,
        portfolioUrl,
        experienceSummary,
        status: "pending",
      });
    }

    // Emit real-time notification event
    notificationEmitter.emit("notification", {
      type: "partner-applied",
      email: session.user.email,
      name: session.user.name,
    });

    return { success: true };
  } catch (error) {
    console.error("Partner application error:", error);
    return { success: false, error: "Server error. Please try again later." };
  }
}

