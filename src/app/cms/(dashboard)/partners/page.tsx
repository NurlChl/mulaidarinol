import dbConnect from "@/lib/db";
import PartnerApplication from "@/lib/models/PartnerApplication";
import PartnerReviews from "./PartnerReviews";

export default async function CMSPartnersPage() {
  await dbConnect();

  // Query all applications, populating user details
  const applications = await PartnerApplication.find()
    .populate("userId", "name email image")
    .sort({ createdAt: -1 })
    .lean();

  // Serialize Mongoose documents
  const serializedApplications = applications.map((app: any) => ({
    _id: app._id.toString(),
    portfolioUrl: app.portfolioUrl,
    experienceSummary: app.experienceSummary,
    status: app.status,
    createdAt: app.createdAt.toISOString(),
    userId: app.userId
      ? {
          name: app.userId.name,
          email: app.userId.email,
          image: app.userId.image,
        }
      : undefined,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Partner Applications</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Tinjau portfolio pengembang dan berikan persetujuan untuk menjadi Mitra Kontributor (Partner).
        </p>
      </div>

      <PartnerReviews initialApplications={serializedApplications} />
    </div>
  );
}
