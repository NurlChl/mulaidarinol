import mongoose from "mongoose";
import dbConnect from "../src/lib/db";
import Roadmap from "../src/lib/models/Roadmap";

async function run() {
  await dbConnect();
  const r = await Roadmap.findOne({ slug: "web-developer" });
  if (r) {
    console.log("Roadmap web-developer found:");
    console.log("  isPublished:", r.isPublished);
    console.log("  visibility:", r.visibility);
  } else {
    console.log("Roadmap web-developer NOT found in DB!");
  }
  mongoose.connection.close();
}

run().catch(console.error);
