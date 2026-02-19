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
            { id: "team1", name: "Team 1", remainingPoints: 100000, threeDartAverage: 0 },
            { id: "team2", name: "Team 2", remainingPoints: 100000, threeDartAverage: 0 },
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

    // Calculate 3-dart averages per team
    const teamAverages: Record<string, number> = {};
    teams.forEach((team: any) => {
      const teamScores = allScores
        .filter((s: any) => s.team_id === team.id)
        .map((s: any) => Number(s.score));
      
      if (teamScores.length === 0) {
        teamAverages[team.id] = 0;
        return;
      }

      // Group into rounds of 3
      const rounds: number[][] = [];
      for (let i = 0; i < teamScores.length; i += 3) {
        rounds.push(teamScores.slice(i, i + 3));
      }

      // Calculate average of all rounds (sum of round totals / number of rounds)
      if (rounds.length === 0) {
        teamAverages[team.id] = 0;
      } else {
        const roundTotals = rounds.map(round => round.reduce((a, b) => a + b, 0));
        const totalScore = roundTotals.reduce((a, b) => a + b, 0);
        teamAverages[team.id] = Math.round((totalScore / rounds.length) * 10) / 10; // Round to 1 decimal
      }
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
          { id: "team1", name: "Team 1", remainingPoints: 100000 },
          { id: "team2", name: "Team 2", remainingPoints: 100000 },
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
      await sql`
        UPDATE game_state 
        SET started_at = COALESCE(started_at, NOW()), updated_at = NOW() 
        WHERE id = 'default'
      `;
      return NextResponse.json({ success: true });
    }

    if (action === "reset") {
      await sql`UPDATE game_state SET started_at = NULL, updated_at = NOW() WHERE id = 'default'`;
      await sql`UPDATE teams SET remaining_points = 100000, updated_at = NOW()`;
      await sql`DELETE FROM scores`;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Game update error:", error);
    return NextResponse.json(
      { error: "Failed to update game" },
      { status: 500 }
    );
  }
}
