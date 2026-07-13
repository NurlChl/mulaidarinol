import { getCmsArticles } from "@/app/actions/article";
import { CmsArticleManager } from "@/components/CmsArticleManager";

export default async function CMSArticlesPage() {
  const res = await getCmsArticles();
  const articles = res.success ? res.articles || [] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Artikel & Blog (SEO)</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Tulis artikel berkualitas tinggi untuk meningkatkan otoritas domain web dan performa SEO secara dinamis.
        </p>
      </div>

      <CmsArticleManager articles={articles} />
    </div>
  );
}
