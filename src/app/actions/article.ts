"use server";

import dbConnect from "@/lib/db";
import Article from "@/lib/models/Article";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// Helper guard for CMS roles (partner, admin, superadmin)
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

export async function saveArticle(articleData: {
  _id?: string;
  title: string;
  slug: string;
  content: string;
  summary?: string;
  coverImage?: string;
  status: "draft" | "published";
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
}) {
  const session = await getCmsSession();
  await dbConnect();

  const {
    _id,
    title,
    slug,
    content,
    summary,
    coverImage,
    status,
    seoTitle,
    seoDescription,
    seoKeywords,
  } = articleData;

  if (!title || !slug || !content) {
    return { success: false, error: "Title, slug, and content are required." };
  }

  try {
    // Check if slug is unique (excluding currently edited article)
    const existing = await Article.findOne({ slug, _id: { $ne: _id } });
    if (existing) {
      return { success: false, error: "Slug sudah digunakan oleh artikel lain. Silakan ubah slug." };
    }

    if (_id) {
      // Update existing
      const article = await Article.findById(_id);
      if (!article) {
        return { success: false, error: "Artikel tidak ditemukan." };
      }

      // Partner can only edit their own articles, Admin/Superadmin can edit any
      if (session.user.role === "partner" && article.authorId.toString() !== session.user.id) {
        return { success: false, error: "Anda hanya diperbolehkan mengedit artikel milik Anda sendiri." };
      }

      article.title = title;
      article.slug = slug;
      article.content = content;
      article.summary = summary;
      article.coverImage = coverImage;
      article.status = status;
      article.seoTitle = seoTitle;
      article.seoDescription = seoDescription;
      article.seoKeywords = seoKeywords || [];
      await article.save();
    } else {
      // Create new
      await Article.create({
        title,
        slug,
        content,
        summary,
        coverImage,
        status,
        authorId: session.user.id,
        seoTitle,
        seoDescription,
        seoKeywords: seoKeywords || [],
      });
    }

    revalidatePath("/articles");
    revalidatePath(`/articles/${slug}`);
    revalidatePath("/cms/articles");
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    console.error("Save article error:", error);
    return { success: false, error: error.message || "Gagal menyimpan artikel." };
  }
}

export async function deleteArticle(id: string) {
  const session = await getCmsSession();
  await dbConnect();

  try {
    const article = await Article.findById(id);
    if (!article) {
      return { success: false, error: "Artikel tidak ditemukan." };
    }

    // Partner can only delete their own articles
    if (session.user.role === "partner" && article.authorId.toString() !== session.user.id) {
      return { success: false, error: "Anda hanya diperbolehkan menghapus artikel milik Anda sendiri." };
    }

    await Article.findByIdAndDelete(id);

    revalidatePath("/articles");
    revalidatePath(`/articles/${article.slug}`);
    revalidatePath("/cms/articles");
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    console.error("Delete article error:", error);
    return { success: false, error: error.message || "Gagal menghapus artikel." };
  }
}

export async function getCmsArticles() {
  const session = await getCmsSession();
  await dbConnect();

  try {
    let query = {};
    // Partner can only see their own articles in list
    if (session.user.role === "partner") {
      query = { authorId: session.user.id };
    }

    const articles = await Article.find(query)
      .sort({ createdAt: -1 })
      .populate("authorId", "name email")
      .lean();

    return {
      success: true,
      articles: articles.map((a: any) => ({
        _id: a._id.toString(),
        title: a.title,
        slug: a.slug,
        status: a.status,
        authorName: a.authorId?.name || "Unknown",
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      })),
    };
  } catch (error: any) {
    console.error("Get CMS articles error:", error);
    return { success: false, error: error.message || "Failed to load articles." };
  }
}

export async function getArticles(page: number = 1, limit: number = 9, search: string = "") {
  await dbConnect();
  try {
    const query: any = { status: "published" };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { summary: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }

    const total = await Article.countDocuments(query);
    const articles = await Article.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("authorId", "name image")
      .lean();

    return {
      success: true,
      articles: articles.map((a: any) => ({
        _id: a._id.toString(),
        title: a.title,
        slug: a.slug,
        summary: a.summary || "",
        coverImage: a.coverImage || "",
        authorName: a.authorId?.name || "MulaiDariNol",
        authorImage: a.authorId?.image || "",
        createdAt: a.createdAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error: any) {
    console.error("Get public articles error:", error);
    return { success: false, articles: [], pagination: { page: 1, limit, total: 0, totalPages: 0 } };
  }
}

export async function getArticleBySlug(slug: string) {
  await dbConnect();
  try {
    const article: any = await Article.findOne({ slug })
      .populate("authorId", "name image")
      .lean();

    if (!article) return null;

    return {
      _id: article._id.toString(),
      title: article.title,
      slug: article.slug,
      content: article.content,
      summary: article.summary || "",
      coverImage: article.coverImage || "",
      status: article.status,
      authorName: article.authorId?.name || "MulaiDariNol",
      authorImage: article.authorId?.image || "",
      seoTitle: article.seoTitle || "",
      seoDescription: article.seoDescription || "",
      seoKeywords: article.seoKeywords || [],
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
    };
  } catch (error) {
    console.error("Get article by slug error:", error);
    return null;
  }
}
