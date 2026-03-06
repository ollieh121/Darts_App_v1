import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { auth } from "@/auth";

/** DELETE: Remove a support message (scorer only). Use to remove profanity or inappropriate content. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
      return NextResponse.json(
        { error: "Database not connected" },
        { status: 503 }
      );
    }

    const { id } = await params;
    const idNum = parseInt(id, 10);
    if (isNaN(idNum) || idNum < 1) {
      return NextResponse.json({ error: "Invalid message id" }, { status: 400 });
    }

    await sql`DELETE FROM support_messages WHERE id = ${idNum}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Support message delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete message" },
      { status: 500 }
    );
  }
}
