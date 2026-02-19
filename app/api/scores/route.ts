import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { auth } from "@/auth";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { teamId, score } = body;

    if (!teamId || typeof score !== "number" || score < 0 || score > 180) {
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
    const newRemaining = Math.max(0, current - score);

    await sql`INSERT INTO scores (team_id, score) VALUES (${teamId}, ${score})`;
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
