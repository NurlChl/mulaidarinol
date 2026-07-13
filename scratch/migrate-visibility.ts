import mongoose from "mongoose";
import dbConnect from "../src/lib/db";
import Roadmap from "../src/lib/models/Roadmap";

async function run() {
  await dbConnect();
  
  const roadmaps = await Roadmap.find({});
  console.log(`Found ${roadmaps.length} roadmaps in database.`);

  for (const r of roadmaps) {
    if (r.isPublished && r.visibility !== "published") {
      console.log(`Forcing '${r.title}' (slug: ${r.slug}) to 'published' because isPublished is true`);
      r.visibility = "published";
      await r.save();
    } else {
      console.log(`Roadmap '${r.title}' (slug: ${r.slug}) status: isPublished=${r.isPublished}, visibility='${r.visibility}'`);
    }
  }

  console.log("Migration complete!");
  mongoose.connection.close();
}

run().catch(console.error);
