import { NextResponse } from "next/server";

export async function GET() {
  const timestamp = Date.now();

  return NextResponse.json({
    status: "ok",
    timestamp,
    services: ["supabase", "openai"],
  });
}
