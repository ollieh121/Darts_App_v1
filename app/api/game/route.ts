import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { auth } from "@/auth";

const CHALLENGE_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours

export async function GET() {
  try {
    const [gameState] = await sql`SELECT started_at FROM game_state WHERE id = 'default'`;
    const teams = await sql`SELECT id, name, remaining_points FROM teams ORDER BY id`;

    const startedAt = gameState?.started_at
      ? new Date(gameState.started_at).getTime()
      : null;
    const now = Date.now();
    const elapsed = startedAt ? now - startedAt : 0;
    const remainingMs = Math.max(0, CHALLENGE_DURATION_MS - elapsed);
    const isRunning = startedAt !== null && remainingMs > 0;

    return NextResponse.json({
      startedAt: startedAt ? new Date(startedAt).toISOString() : null,
      remainingMs,
      isRunning,
      teams: teams.map((t) => ({
        id: t.id,
        name: t.name,
        remainingPoints: Number(t.remaining_points),
      })),
    });
  } catch (error) {
    console.error("Game state fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch game state" },
      { status: 500 }
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
