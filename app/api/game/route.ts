import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { auth } from "@/auth";

const CHALLENGE_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours

export async function GET() {
  try {
    if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
      return NextResponse.json(
        {
          startedAt: null,
          remainingMs: CHALLENGE_DURATION_MS,
          isRunning: false,
          teams: [
            { id: "team1", name: "Team 1", remainingPoints: 100000, threeDartAverage: 0, last3Scores: [], count100: 0, count140: 0, count180: 0 },
            { id: "team2", name: "Team 2", remainingPoints: 100000, threeDartAverage: 0, last3Scores: [], count100: 0, count140: 0, count180: 0 },
          ],
        },
        { status: 200 }
      );
    }

    const [gameState] = await sql`SELECT started_at FROM game_state WHERE id = 'default'`;
    const teams = await sql`SELECT id, name, remaining_points FROM teams ORDER BY id`;

    // Get scores for 3-dart average calculation
    const allScores = await sql`
      SELECT team_id, score, created_at 
      FROM scores 
      ORDER BY team_id, created_at ASC
    `;

    const startedAt = gameState?.started_at
      ? new Date(gameState.started_at).getTime()
      : null;
    const now = Date.now();
    const elapsed = startedAt ? now - startedAt : 0;
    const remainingMs = Math.max(0, CHALLENGE_DURATION_MS - elapsed);
    const isRunning = startedAt !== null && remainingMs > 0;

    // Per-team: 3-dart average, last 3 scores, and 100/140/180 counts
    const teamAverages: Record<string, number> = {};
    const teamLast3: Record<string, number[]> = {};
    const teamCount100: Record<string, number> = {};
    const teamCount140: Record<string, number> = {};
    const teamCount180: Record<string, number> = {};

    teams.forEach((team: any) => {
      const teamScores = allScores
        .filter((s: any) => s.team_id === team.id)
        .map((s: any) => Number(s.score));

      teamLast3[team.id] = teamScores.slice(-3).reverse();
      teamCount100[team.id] = teamScores.filter((x) => x === 100).length;
      teamCount140[team.id] = teamScores.filter((x) => x === 140).length;
      teamCount180[team.id] = teamScores.filter((x) => x === 180).length;

      if (teamScores.length === 0) {
        teamAverages[team.id] = 0;
        return;
      }
      const totalScore = teamScores.reduce((a, b) => a + b, 0);
      const avg = totalScore / teamScores.length;
      teamAverages[team.id] = Math.round(avg * 10) / 10;
    });

    return NextResponse.json({
      startedAt: startedAt ? new Date(startedAt).toISOString() : null,
      remainingMs,
      isRunning,
      teams: teams.map((t: any) => ({
        id: t.id,
        name: t.name,
        remainingPoints: Number(t.remaining_points),
        threeDartAverage: teamAverages[t.id] || 0,
        last3Scores: teamLast3[t.id] || [],
        count100: teamCount100[t.id] || 0,
        count140: teamCount140[t.id] || 0,
        count180: teamCount180[t.id] || 0,
      })),
    });
  } catch (error) {
    console.error("Game state fetch error:", error);
    // Return default data if DB fails
    return NextResponse.json(
      {
        startedAt: null,
        remainingMs: CHALLENGE_DURATION_MS,
        isRunning: false,
        teams: [
          { id: "team1", name: "Team 1", remainingPoints: 100000, threeDartAverage: 0, last3Scores: [], count100: 0, count140: 0, count180: 0 },
          { id: "team2", name: "Team 2", remainingPoints: 100000, threeDartAverage: 0, last3Scores: [], count100: 0, count140: 0, count180: 0 },
        ],
      },
      { status: 200 }
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    if (action === "start") {
      if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
        return NextResponse.json(
          { error: "Database not connected. Please set up your Neon database." },
          { status: 500 }
        );
      }
      try {
        // First, ensure the game_state row exists
        await sql`
          INSERT INTO game_state (id, started_at) 
          VALUES ('default', NOW()) 
          ON CONFLICT (id) 
          DO UPDATE SET started_at = COALESCE(game_state.started_at, NOW()), updated_at = NOW()
        `;
        return NextResponse.json({ success: true });
      } catch (dbError: any) {
        console.error("Database error starting timer:", dbError);
        const errorMessage = dbError?.message || "Unknown database error";
        if (errorMessage.includes("does not exist") || errorMessage.includes("relation")) {
          return NextResponse.json(
            { 
              error: "Database tables not found. Please run the SQL schema from lib/schema.sql in your Neon dashboard.",
              details: errorMessage
            },
            { status: 500 }
          );
        }
        return NextResponse.json(
          { 
            error: `Database error: ${errorMessage}`,
            details: errorMessage
          },
          { status: 500 }
        );
      }
    }

    if (action === "reset") {
      await sql`UPDATE game_state SET started_at = NULL, updated_at = NOW() WHERE id = 'default'`;
      await sql`UPDATE teams SET remaining_points = 100000, updated_at = NOW()`;
      await sql`DELETE FROM scores`;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Game update error:", error);
    const errorMessage = error?.message || "Unknown error";
    return NextResponse.json(
      { 
        error: `Failed to update game: ${errorMessage}`,
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
