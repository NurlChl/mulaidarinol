import { NextRequest } from "next/server";
import { handlers } from "../src/lib/auth";

async function run() {
  const req = new NextRequest("http://localhost:3000/api/auth/session");
  try {
    const res = await handlers.GET(req);
    console.log("Response status:", res.status);
    console.log("Response headers:");
    res.headers.forEach((v, k) => console.log(`  ${k}: ${v}`));
    const body = await res.text();
    console.log("Response body:", body.substring(0, 500));
  } catch (error) {
    console.error("Error executing NextAuth handler:", error);
  }
}

run();
