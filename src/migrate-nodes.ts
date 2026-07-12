import mongoose from "mongoose";
import dbConnect from "./lib/db";
import Roadmap from "./lib/models/Roadmap";

async function run() {
  await dbConnect();
  
  const roadmaps = await Roadmap.find({});
  console.log(`Found ${roadmaps.length} roadmaps to check.`);

  let updatedCount = 0;
  for (const r of roadmaps) {
    let changed = false;
    const newNodes = r.nodes.map((node: any) => {
      if (node.type === "quiz" || node.type === "challenge") {
        console.log(`Updating node '${node.id}' in roadmap '${r.title}' from type '${node.type}' to 'topic'`);
        node.type = "topic";
        changed = true;
        updatedCount++;
      }
      return node;
    });

    if (changed) {
      r.nodes = newNodes;
      r.markModified("nodes");
      await r.save();
      console.log(`Saved roadmap: ${r.title}`);
    }
  }

  console.log(`Migration complete. Updated ${updatedCount} nodes.`);
  mongoose.connection.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
