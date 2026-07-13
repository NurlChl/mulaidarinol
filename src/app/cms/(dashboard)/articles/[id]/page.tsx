import dbConnect from "@/lib/db";
import Article from "@/lib/models/Article";
import CmsArticleEditor from "@/components/CmsArticleEditor";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CMSArticleFormPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();

  if (id === "new") {
    return <CmsArticleEditor initialArticle={null} />;
  }

  await dbConnect();
  
  // Find article by ID
  let articleDoc: any = null;
  try {
    articleDoc = await Article.findById(id).lean() as any;
  } catch (error) {
    // If invalid ObjectId, return 404
    return notFound();
  }

  if (!articleDoc) {
    return notFound();
  }

  // Guard: Partner can only edit their own articles
  if (session?.user?.role === "partner" && articleDoc.authorId.toString() !== session?.user?.id) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-xs">
        <h3 className="font-bold text-foreground">Akses Terbatas</h3>
        <p className="text-muted-foreground mt-1">
          Anda tidak memiliki izin untuk mengedit artikel ini karena bukan milik Anda.
        </p>
      </div>
    );
  }

  const serializedArticle = {
    _id: articleDoc._id.toString(),
    title: articleDoc.title,
    slug: articleDoc.slug,
    content: articleDoc.content,
    summary: articleDoc.summary || "",
    coverImage: articleDoc.coverImage || "",
    status: articleDoc.status as "draft" | "published",
    seoTitle: articleDoc.seoTitle || "",
    seoDescription: articleDoc.seoDescription || "",
    seoKeywords: articleDoc.seoKeywords || [],
  };

  return <CmsArticleEditor initialArticle={serializedArticle} />;
}
