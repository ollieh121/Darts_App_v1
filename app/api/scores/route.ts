import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { auth } from "@/auth";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
    return NextResponse.json(
      { error: "Database not connected. Please set up your Neon database." },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { teamId, score } = body;

    // Convert score to number if it's a string
    const scoreNum = typeof score === "string" ? parseInt(score, 10) : score;

    if (!teamId || typeof scoreNum !== "number" || isNaN(scoreNum) || scoreNum < 0 || scoreNum > 180) {
      return NextResponse.json(
        { error: "Invalid teamId or score (must be 0-180)" },
        { status: 400 }
      );
    }

    const [team] = await sql`SELECT remaining_points FROM teams WHERE id = ${teamId}`;
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const current = Number(team.remaining_points);
    const newRemaining = Math.max(0, current - scoreNum);

    await sql`INSERT INTO scores (team_id, score) VALUES (${teamId}, ${scoreNum})`;
    await sql`
      UPDATE teams 
      SET remaining_points = ${newRemaining}, updated_at = NOW() 
      WHERE id = ${teamId}
    `;

    return NextResponse.json({
      success: true,
      remainingPoints: newRemaining,
    });
  } catch (error) {
    console.error("Score update error:", error);
    return NextResponse.json(
      { error: "Failed to add score" },
      { status: 500 }
    );
  }
}
