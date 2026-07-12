"use my-server-action";
"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import Roadmap from "@/lib/models/Roadmap";
import Material from "@/lib/models/Material";
import Quiz from "@/lib/models/Quiz";
import CodeChallenge from "@/lib/models/CodeChallenge";
import PartnerApplication from "@/lib/models/PartnerApplication";
import UserProgress from "@/lib/models/UserProgress";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import notificationEmitter from "@/lib/emitter";
import VerificationCode from "@/lib/models/VerificationCode";
import nodemailer from "nodemailer";


// Helper guard for general CMS roles (partner, admin, superadmin)
async function getCmsSession() {
  const session = await auth();
  if (!session || !session.user) {
    throw new Error("Unauthorized: Please log in.");
  }
  
  const role = session.user.role;
  if (role !== "partner" && role !== "admin" && role !== "superadmin") {
    throw new Error("Unauthorized: Insufficient permissions.");
  }
  
  return session;
}

// Helper guard for administrator roles (admin, superadmin)
async function getAdminSession() {
  const session = await auth();
  if (!session || !session.user) {
    throw new Error("Unauthorized: Please log in.");
  }
  
  const role = session.user.role;
  if (role !== "admin" && role !== "superadmin") {
    throw new Error("Unauthorized: Administrator permissions required.");
  }
  
  return session;
}

// Helper guard for superadmin role only
async function getSuperadminSession() {
  const session = await auth();
  if (!session || !session.user || session.user.role !== "superadmin") {
    throw new Error("Unauthorized: Superadmin credentials required.");
  }
  return session;
}

// ----------------------------------------------------
// 1. DASHBOARD ANALYTICS / STATS
// ----------------------------------------------------
export async function getDashboardStats() {
  await getCmsSession();
  await dbConnect();

  try {
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalPartners = await User.countDocuments({ role: "partner" });
    const totalAdmins = await User.countDocuments({ role: { $in: ["admin", "superadmin"] } });
    const totalRoadmaps = await Roadmap.countDocuments();
    const pendingApplications = await PartnerApplication.countDocuments({ status: "pending" });
    const totalCompletedNodes = await UserProgress.aggregate([
      { $project: { count: { $size: "$completedNodes" } } },
      { $group: { _id: null, total: { $sum: "$count" } } }
    ]);

    return {
      stats: {
        users: totalUsers,
        partners: totalPartners,
        admins: totalAdmins,
        roadmaps: totalRoadmaps,
        pendingApps: pendingApplications,
        nodeCompletions: totalCompletedNodes[0]?.total || 0,
      }
    };
  } catch (error: any) {
    console.error("Dashboard stats error:", error);
    return { error: error.message || "Failed to fetch stats." };
  }
}

// ----------------------------------------------------
// 2. ROADMAP ACTIONS
// ----------------------------------------------------
export async function saveRoadmap(roadmapData: {
  id?: string;
  title: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  isPublished: boolean;
  nodes: any[];
}) {
  const session = await getCmsSession();
  await dbConnect();

  const { id, title, slug, description, icon, color, isPublished, nodes } = roadmapData;

  try {
    let roadmap;

    if (id) {
      // Update
      roadmap = await Roadmap.findById(id);
      if (!roadmap) {
        return { success: false, error: "Roadmap not found." };
      }

      // Restrict partners to editing only their own roadmaps
      if (session.user.role === "partner" && roadmap.creatorId.toString() !== session.user.id) {
        return { success: false, error: "Access denied. You can only edit your own roadmaps." };
      }

      roadmap.title = title;
      roadmap.slug = slug;
      roadmap.description = description;
      roadmap.icon = icon;
      roadmap.color = color;
      roadmap.isPublished = isPublished;
      roadmap.nodes = nodes;
      await roadmap.save();
    } else {
      // Create
      roadmap = await Roadmap.create({
        title,
        slug,
        description,
        icon,
        color,
        isPublished,
        creatorId: session.user.id,
        nodes,
      });
    }

    // Emit real-time notification
    notificationEmitter.emit("notification", {
      type: "roadmap-saved",
      title,
      isPublished,
    });

    // Revalidate all roadmap-related pages
    revalidatePath("/cms/roadmaps");
    revalidatePath("/roadmaps");
    revalidatePath(`/roadmaps/${slug}`);
    revalidatePath("/");

    return { success: true, roadmapId: roadmap._id.toString(), slug };
  } catch (error: any) {
    console.error("Save roadmap error:", error);
    return { success: false, error: error.message || "Failed to save roadmap." };
  }
}

export async function deleteRoadmap(roadmapId: string) {
  const session = await getCmsSession();
  await dbConnect();

  try {
    const roadmap = await Roadmap.findById(roadmapId);
    if (!roadmap) {
      return { success: false, error: "Roadmap not found." };
    }

    if (session.user.role === "partner" && roadmap.creatorId.toString() !== session.user.id) {
      return { success: false, error: "Access denied. You can only delete your own roadmaps." };
    }

    const deletedSlug = roadmap.slug;
    await Roadmap.findByIdAndDelete(roadmapId);
    
    // Cascading delete associated materials, quizzes, code challenges
    await Material.deleteMany({ roadmapId });
    await Quiz.deleteMany({ roadmapId });
    await CodeChallenge.deleteMany({ roadmapId });
    await UserProgress.deleteMany({ roadmapId });

    // Revalidate pages
    revalidatePath("/cms/roadmaps");
    revalidatePath("/roadmaps");
    revalidatePath(`/roadmaps/${deletedSlug}`);
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    console.error("Delete roadmap error:", error);
    return { success: false, error: error.message || "Failed to delete roadmap." };
  }
}

// ----------------------------------------------------
// 3. MATERIAL ACTIONS
// ----------------------------------------------------
export async function saveMaterial(materialData: {
  roadmapId: string;
  nodeId: string;
  title: string;
  slug: string;
  content: string;
}) {
  await getCmsSession();
  await dbConnect();

  const { roadmapId, nodeId, title, slug, content } = materialData;

  try {
    // Check if material already exists
    let material = await Material.findOne({ roadmapId, nodeId });

    if (material) {
      material.title = title;
      material.slug = slug;
      material.content = content;
      await material.save();
    } else {
      material = await Material.create({
        roadmapId,
        nodeId,
        title,
        slug,
        content,
      });

      // Update node type inside Roadmap if needed
      await Roadmap.updateOne(
        { _id: roadmapId, "nodes.id": nodeId },
        { $set: { "nodes.$.type": "topic" } }
      );
    }

    // Revalidate material page so content is fresh
    const roadmapDoc = await Roadmap.findById(roadmapId).lean() as any;
    if (roadmapDoc?.slug) {
      revalidatePath(`/roadmaps/${roadmapDoc.slug}/${nodeId}`);
      revalidatePath(`/roadmaps/${roadmapDoc.slug}`);
    }
    revalidatePath("/cms/materials");

    return { success: true, materialId: material._id.toString() };
  } catch (error: any) {
    console.error("Save material error:", error);
    return { success: false, error: error.message || "Failed to save material content." };
  }
}

// ----------------------------------------------------
// 4. QUIZ & CHALLENGE ACTIONS
// ----------------------------------------------------
export async function saveQuiz(quizData: {
  roadmapId: string;
  nodeId: string;
  title: string;
  timeLimit: number;
  questions: any[];
}) {
  await getCmsSession();
  await dbConnect();

  const { roadmapId, nodeId, title, timeLimit, questions } = quizData;

  try {
    let quiz = await Quiz.findOne({ roadmapId, nodeId });

    if (quiz) {
      quiz.title = title;
      quiz.timeLimit = timeLimit;
      quiz.questions = questions;
      await quiz.save();
    } else {
      quiz = await Quiz.create({
        roadmapId,
        nodeId,
        title,
        timeLimit,
        questions,
      });

      // Link to Material if it exists
      await Material.updateOne(
        { roadmapId, nodeId },
        { $set: { quizId: quiz._id } }
      );
    }

    // Revalidate quiz page
    const roadmapDoc2 = await Roadmap.findById(roadmapId).lean() as any;
    if (roadmapDoc2?.slug) {
      revalidatePath(`/roadmaps/${roadmapDoc2.slug}/${nodeId}`);
    }
    revalidatePath("/cms/quizzes");

    return { success: true, quizId: quiz._id.toString() };
  } catch (error: any) {
    console.error("Save quiz error:", error);
    return { success: false, error: error.message || "Failed to save quiz." };
  }
}

export async function saveCodeChallenge(challengeData: {
  roadmapId: string;
  nodeId: string;
  title: string;
  description: string;
  language: "javascript" | "html" | "css";
  initialCode: string;
  testCases: any[];
}) {
  await getCmsSession();
  await dbConnect();

  const { roadmapId, nodeId, title, description, language, initialCode, testCases } = challengeData;

  try {
    let challenge = await CodeChallenge.findOne({ roadmapId, nodeId });

    if (challenge) {
      challenge.title = title;
      challenge.description = description;
      challenge.language = language;
      challenge.initialCode = initialCode;
      challenge.testCases = testCases;
      await challenge.save();
    } else {
      challenge = await CodeChallenge.create({
        roadmapId,
        nodeId,
        title,
        description,
        language,
        initialCode,
        testCases,
      });

      // Link to Material if it exists
      await Material.updateOne(
        { roadmapId, nodeId },
        { $set: { challengeId: challenge._id } }
      );
    }

    // Revalidate challenge page
    const roadmapDoc3 = await Roadmap.findById(roadmapId).lean() as any;
    if (roadmapDoc3?.slug) {
      revalidatePath(`/roadmaps/${roadmapDoc3.slug}/${nodeId}`);
    }
    revalidatePath("/cms/quizzes");

    return { success: true, challengeId: challenge._id.toString() };
  } catch (error: any) {
    console.error("Save challenge error:", error);
    return { success: false, error: error.message || "Failed to save challenge." };
  }
}

// ----------------------------------------------------
// 5. PARTNER APPLICATION REVIEW ACTIONS (Admin only)
// ----------------------------------------------------
export async function reviewPartnerApplication(applicationId: string, action: "approve" | "reject") {
  const session = await getAdminSession();
  await dbConnect();

  try {
    const application = await PartnerApplication.findById(applicationId);
    if (!application) {
      return { success: false, error: "Application not found." };
    }

    if (action === "approve") {
      application.status = "approved";
      
      // Update user role to partner
      await User.findByIdAndUpdate(application.userId, {
        role: "partner",
        isPartnerApproved: true,
      });
    } else {
      application.status = "rejected";
    }

    application.reviewedBy = session.user.id as any;
    application.reviewedAt = new Date();
    await application.save();

    // Emit real-time notification
    notificationEmitter.emit("notification", {
      type: "partner-review",
      action,
      userId: application.userId.toString(),
    });

    // Revalidate partner/user pages
    revalidatePath("/cms/partners");
    revalidatePath("/cms/users");
    revalidatePath("/cms");

    return { success: true };
  } catch (error: any) {
    console.error("Review application error:", error);
    return { success: false, error: error.message || "Failed to review application." };
  }
}

// ----------------------------------------------------
// 6. ROLE & ADMIN MANAGEMENT ACTIONS (Superadmin only)
// ----------------------------------------------------
export async function updateUserRole(userId: string, newRole: "user" | "partner" | "admin" | "superadmin") {
  await getSuperadminSession();
  await dbConnect();

  try {
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, error: "User not found." };
    }

    user.role = newRole;
    await user.save();

    // Revalidate admin/user management pages
    revalidatePath("/cms/users");
    revalidatePath("/cms");

    return { success: true };
  } catch (error: any) {
    console.error("Update role error:", error);
    return { success: false, error: error.message || "Failed to update user role." };
  }
}

export async function createNewAdmin(adminData: {
  name: string;
  email: string;
  password: string;
  role: "admin" | "superadmin";
}) {
  await getSuperadminSession();
  await dbConnect();

  const { name, email, password, role } = adminData;

  if (!name || !email || !password) {
    return { success: false, error: "All fields are required." };
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return { success: false, error: "Email is already registered." };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = await User.create({
      name,
      email,
      role,
      password: hashedPassword,
    });

    // Revalidate admin management pages
    revalidatePath("/cms/users");
    revalidatePath("/cms");

    return { success: true, adminId: newAdmin._id.toString() };
  } catch (error: any) {
    console.error("Create admin error:", error);
    return { success: false, error: error.message || "Failed to register administrator." };
  }
}

export async function deleteQuiz(roadmapId: string, nodeId: string) {
  await getCmsSession();
  await dbConnect();

  try {
    // 1. Delete Quiz
    await Quiz.deleteOne({ roadmapId, nodeId });

    // 2. Revert node type inside Roadmap to "topic"
    await Roadmap.updateOne(
      { _id: roadmapId, "nodes.id": nodeId },
      { $set: { "nodes.$.type": "topic" } }
    );

    // 3. Remove quizId link in Material if it exists
    await Material.updateOne(
      { roadmapId, nodeId },
      { $unset: { quizId: "" } }
    );

    // Revalidate
    const roadmapDocQ = await Roadmap.findById(roadmapId).lean() as any;
    if (roadmapDocQ?.slug) {
      revalidatePath(`/roadmaps/${roadmapDocQ.slug}/${nodeId}`);
    }
    revalidatePath("/cms/quizzes");

    return { success: true };
  } catch (error: any) {
    console.error("Delete quiz error:", error);
    return { success: false, error: error.message || "Failed to delete quiz." };
  }
}

export async function deleteCodeChallenge(roadmapId: string, nodeId: string) {
  await getCmsSession();
  await dbConnect();

  try {
    // 1. Delete Challenge
    await CodeChallenge.deleteOne({ roadmapId, nodeId });

    // 2. Revert node type inside Roadmap to "topic"
    await Roadmap.updateOne(
      { _id: roadmapId, "nodes.id": nodeId },
      { $set: { "nodes.$.type": "topic" } }
    );

    // 3. Remove challengeId link in Material if it exists
    await Material.updateOne(
      { roadmapId, nodeId },
      { $unset: { challengeId: "" } }
    );

    // Revalidate
    const roadmapDocC = await Roadmap.findById(roadmapId).lean() as any;
    if (roadmapDocC?.slug) {
      revalidatePath(`/roadmaps/${roadmapDocC.slug}/${nodeId}`);
    }
    revalidatePath("/cms/quizzes");

    return { success: true };
  } catch (error: any) {
    console.error("Delete challenge error:", error);
    return { success: false, error: error.message || "Failed to delete challenge." };
  }
}

// ----------------------------------------------------
// 7. PROFILE SETTINGS & OTP VERIFICATION ACTIONS
// ----------------------------------------------------

async function sendOtpEmail(email: string, code: string, purposeText: string) {
  // If SMTP configs are set, send true email. Otherwise, fall back to console print in dev
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT),
        secure: parseInt(SMTP_PORT) === 465,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: `"MulaiDariNol Security" <${SMTP_USER}>`,
        to: email,
        subject: `Kode Verifikasi Keamanan Anda - ${code}`,
        text: `Kode verifikasi Anda untuk ${purposeText} adalah: ${code}. Kode ini berlaku selama 10 menit.`,
        html: `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px; max-width: 480px; margin: auto;">
          <h2 style="color: #450cca; text-align: center;">MulaiDariNol</h2>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          <p>Halo,</p>
          <p>Anda sedang mengajukan <strong>${purposeText}</strong> di platform MulaiDariNol.</p>
          <p>Gunakan kode OTP berikut untuk melanjutkan proses:</p>
          <div style="font-size: 24px; font-weight: bold; letter-spacing: 4px; text-align: center; margin: 20px 0; padding: 12px; background: #f5f3ff; color: #450cca; border-radius: 6px;">
            ${code}
          </div>
          <p style="font-size: 11px; color: #888; text-align: center;">Kode OTP ini berlaku selama 10 menit. Jangan bagikan kode ini kepada siapapun.</p>
        </div>`,
      });
      return true;
    } catch (err) {
      console.error("Nodemailer error sending email:", err);
    }
  }

  // Fallback dev print
  console.log(`\n==========================================\n[DEV MODE OTP] Email: ${email}\nPurpose: ${purposeText}\nCode: ${code}\n==========================================\n`);
  return false;
}

export async function requestPasswordChangeOtp() {
  const session = await auth();
  if (!session || !session.user) {
    throw new Error("Unauthorized: Please log in.");
  }

  await dbConnect();

  try {
    const email = session.user.email as string;

    // Generate random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Expire in 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Save/update OTP
    await VerificationCode.findOneAndUpdate(
      { email, purpose: "password_reset" },
      { code, expiresAt },
      { upsert: true, new: true }
    );

    await sendOtpEmail(email, code, "Ganti Kata Sandi (Password Reset)");

    return { success: true, message: "OTP sent successfully." };
  } catch (error: any) {
    console.error("Request OTP error:", error);
    return { success: false, error: error.message || "Gagal mengirim kode OTP." };
  }
}

export async function verifyAndChangePassword(otp: string, passwordBaru: string) {
  const session = await auth();
  if (!session || !session.user) {
    throw new Error("Unauthorized: Please log in.");
  }

  await dbConnect();

  try {
    const email = session.user.email as string;

    // Retrieve active OTP
    const verification = await VerificationCode.findOne({
      email,
      purpose: "password_reset",
    });

    if (!verification) {
      return { success: false, error: "Kode verifikasi tidak ditemukan atau sudah kedaluwarsa." };
    }

    if (verification.code !== otp) {
      return { success: false, error: "Kode verifikasi salah." };
    }

    // Delete verification code
    await VerificationCode.findByIdAndDelete(verification._id);

    // Update password
    const hashedPassword = await bcrypt.hash(passwordBaru, 10);
    await User.findByIdAndUpdate(session.user.id, { password: hashedPassword });

    return { success: true };
  } catch (error: any) {
    console.error("Verify and change password error:", error);
    return { success: false, error: error.message || "Gagal mengubah kata sandi." };
  }
}

export async function updateAdminEmail(newEmail: string) {
  const session = await auth();
  if (!session || !session.user) {
    throw new Error("Unauthorized: Please log in.");
  }

  await dbConnect();

  try {
    // Basic verification: Check if email is already taken
    const existing = await User.findOne({ email: newEmail });
    if (existing) {
      return { success: false, error: "Email sudah digunakan oleh pengguna lain." };
    }

    await User.findByIdAndUpdate(session.user.id, { email: newEmail });
    return { success: true };
  } catch (error: any) {
    console.error("Update admin email error:", error);
    return { success: false, error: error.message || "Gagal memperbarui email." };
  }
}
