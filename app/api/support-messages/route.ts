import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

/** GET: List support messages (public, for display page). */
export async function GET() {
  try {
    if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
      return NextResponse.json([]);
    }
    const rows = await sql`
      SELECT id, message, created_at FROM support_messages ORDER BY created_at DESC LIMIT 50
    `;
    return NextResponse.json(
      rows.map((r: any) => ({
        id: r.id,
        message: r.message,
        created_at: new Date(r.created_at).toISOString(),
      }))
    );
  } catch {
    return NextResponse.json([]);
  }
}

/** POST: Add a support message (public, for viewers). */
export async function POST(request: Request) {
  try {
    if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
      return NextResponse.json(
        { error: "Database not connected" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!message || message.length > 500) {
      return NextResponse.json(
        { error: "Message required (max 500 characters)" },
        { status: 400 }
      );
    }

    await sql`INSERT INTO support_messages (message) VALUES (${message})`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Support message error:", error);
    return NextResponse.json(
      { error: "Failed to add message" },
      { status: 500 }
    );
  }
}
