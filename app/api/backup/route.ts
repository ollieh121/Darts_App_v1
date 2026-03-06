import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { auth } from "@/auth";

/** GET: Export full game state as JSON backup (scorer only). */
export async function GET() {
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

    const [gameState] = await sql`SELECT started_at FROM game_state WHERE id = 'default'`;
    const teams = await sql`SELECT id, name, remaining_points FROM teams ORDER BY id`;
    const scores = await sql`SELECT team_id, score, created_at FROM scores ORDER BY id`;

    const backup = {
      exportedAt: new Date().toISOString(),
      game_state: {
        started_at: gameState?.started_at
          ? new Date(gameState.started_at).toISOString()
          : null,
      },
      teams: teams.map((t: any) => ({
        id: t.id,
        name: t.name,
        remaining_points: Number(t.remaining_points),
      })),
      scores: scores.map((s: any) => ({
        team_id: s.team_id,
        score: Number(s.score),
        created_at: new Date(s.created_at).toISOString(),
      })),
    };

    return NextResponse.json(backup);
  } catch (error: unknown) {
    console.error("Backup export error:", error);
    const message = error instanceof Error ? error.message : "Connection or query failed";
    return NextResponse.json(
      { error: `Database error: ${message}` },
      { status: 500 }
    );
  }
}

/** POST: Restore game state from JSON backup (scorer only). Overwrites current data. */
export async function POST(request: Request) {
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

    const body = await request.json();
    const { game_state, teams: teamsData, scores: scoresData } = body;

    if (!teamsData || !Array.isArray(teamsData)) {
      return NextResponse.json(
        { error: "Invalid backup: teams array required" },
        { status: 400 }
      );
    }

    // Restore game_state
    const startedAt = game_state?.started_at ?? null;
    await sql`
      UPDATE game_state SET started_at = ${startedAt}, updated_at = NOW() WHERE id = 'default'
    `;

    // Restore teams (update existing rows)
    for (const t of teamsData) {
      if (t.id && t.name != null && typeof t.remaining_points === "number") {
        await sql`
          UPDATE teams SET name = ${t.name}, remaining_points = ${t.remaining_points}, updated_at = NOW() WHERE id = ${t.id}
        `;
      }
    }

    // Clear and re-insert scores
    await sql`DELETE FROM scores`;
    if (scoresData && Array.isArray(scoresData)) {
      for (const s of scoresData) {
        if (s.team_id && typeof s.score === "number") {
          await sql`INSERT INTO scores (team_id, score) VALUES (${s.team_id}, ${s.score})`;
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Backup restore error:", error);
    return NextResponse.json(
      { error: "Failed to restore backup" },
      { status: 500 }
    );
  }
}
