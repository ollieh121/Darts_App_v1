import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
    return NextResponse.json({
      connected: false,
      error: "No database connection string found",
      message: "Please add Neon database integration in Vercel",
    });
  }

  try {
    // Try to query the game_state table
    await sql`SELECT 1 FROM game_state LIMIT 1`;
    
    // Try to query teams table
    await sql`SELECT 1 FROM teams LIMIT 1`;
    
    // Try to query scores table
    await sql`SELECT 1 FROM scores LIMIT 1`;

    return NextResponse.json({
      connected: true,
      tablesExist: true,
      message: "Database is connected and tables exist",
    });
  } catch (error: any) {
    const errorMessage = error?.message || "Unknown error";
    if (errorMessage.includes("does not exist") || errorMessage.includes("relation")) {
      return NextResponse.json({
        connected: true,
        tablesExist: false,
        error: errorMessage,
        message: "Database is connected but tables don't exist. Please run the SQL from lib/schema.sql in your Neon dashboard.",
      });
    }
    return NextResponse.json({
      connected: true,
      tablesExist: false,
      error: errorMessage,
      message: `Database error: ${errorMessage}`,
    });
  }
}
