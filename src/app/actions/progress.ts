"use my-server-action";
"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import UserProgress from "@/lib/models/UserProgress";
import Roadmap from "@/lib/models/Roadmap";
import Quiz from "@/lib/models/Quiz";
import CodeChallenge from "@/lib/models/CodeChallenge";
import mongoose from "mongoose";

// Helper to get or create UserProgress document
async function getOrCreateProgress(userId: string, roadmapId: string | mongoose.Types.ObjectId) {
  let progress = await UserProgress.findOne({ userId, roadmapId });
  if (!progress) {
    progress = await UserProgress.create({
      userId,
      roadmapId,
      completedNodes: [],
      quizAttempts: [],
      challengeSubmissions: [],
    });
  }
  return progress;
}

export async function toggleNodeCompletion(roadmapSlug: string, nodeId: string) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "You must be logged in to save progress." };
  }

  try {
    await dbConnect();
    const roadmap = await Roadmap.findOne({ slug: roadmapSlug });
    if (!roadmap) {
      return { success: false, error: "Roadmap not found." };
    }

    const progress = await getOrCreateProgress(session.user.id, roadmap._id.toString());

    const index = progress.completedNodes.indexOf(nodeId);
    let completed = false;

    if (index > -1) {
      // Remove if already completed
      progress.completedNodes.splice(index, 1);
    } else {
      // Add to completed
      progress.completedNodes.push(nodeId);
      completed = true;
    }

    await progress.save();

    // Revalidate roadmap page so progress bar updates
    revalidatePath(`/roadmaps/${roadmapSlug}`);
    revalidatePath(`/roadmaps/${roadmapSlug}/${nodeId}`);

    return { success: true, completed };
  } catch (error) {
    console.error("Error toggling node completion:", error);
    return { success: false, error: "Failed to update progress." };
  }
}

export async function submitQuizAttempt(
  roadmapSlug: string,
  nodeId: string,
  quizId: string,
  userAnswers: number[],
  timeSpent: number
) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "You must be logged in to save quiz results." };
  }

  try {
    await dbConnect();
    const roadmap = await Roadmap.findOne({ slug: roadmapSlug });
    const quiz = await Quiz.findById(quizId);

    if (!roadmap || !quiz) {
      return { success: false, error: "Roadmap or Quiz not found." };
    }

    // Grade the quiz
    let correctCount = 0;
    quiz.questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctOptionIndex) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / quiz.questions.length) * 100);
    const passed = score >= 70; // Pass threshold 70%

    const progress = await getOrCreateProgress(session.user.id, roadmap._id.toString());

    // Save the attempt
    progress.quizAttempts.push({
      quizId: quiz._id as mongoose.Types.ObjectId,
      score,
      passed,
      timeSpent,
      completedAt: new Date(),
    });

    // If passed, auto-complete the node
    if (passed && !progress.completedNodes.includes(nodeId)) {
      progress.completedNodes.push(nodeId);
    }

    await progress.save();

    // Revalidate roadmap page so progress updates
    revalidatePath(`/roadmaps/${roadmapSlug}`);
    revalidatePath(`/roadmaps/${roadmapSlug}/${nodeId}`);

    return {
      success: true,
      score,
      passed,
      correctCount,
      totalCount: quiz.questions.length,
    };
  } catch (error) {
    console.error("Error submitting quiz:", error);
    return { success: false, error: "Failed to record quiz attempt." };
  }
}

export async function submitChallengeCode(
  roadmapSlug: string,
  nodeId: string,
  challengeId: string,
  code: string,
  passed: boolean
) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "You must be logged in to submit code." };
  }

  try {
    await dbConnect();
    const roadmap = await Roadmap.findOne({ slug: roadmapSlug });
    const challenge = await CodeChallenge.findById(challengeId);

    if (!roadmap || !challenge) {
      return { success: false, error: "Roadmap or Challenge not found." };
    }

    const progress = await getOrCreateProgress(session.user.id, roadmap._id.toString());

    // Record submission
    progress.challengeSubmissions.push({
      challengeId: challenge._id as mongoose.Types.ObjectId,
      code,
      passed,
      completedAt: new Date(),
    });

    // If challenge passed, auto-complete the node
    if (passed && !progress.completedNodes.includes(nodeId)) {
      progress.completedNodes.push(nodeId);
    }

    await progress.save();

    // Revalidate roadmap page so progress updates
    revalidatePath(`/roadmaps/${roadmapSlug}`);
    revalidatePath(`/roadmaps/${roadmapSlug}/${nodeId}`);

    return { success: true, passed };
  } catch (error) {
    console.error("Error submitting challenge:", error);
    return { success: false, error: "Failed to record challenge submission." };
  }
}
