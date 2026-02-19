"use client";

import { useEffect, useState } from "react";

interface Team {
  id: string;
  name: string;
  remainingPoints: number;
}

interface GameState {
  startedAt: string | null;
  remainingMs: number;
  isRunning: boolean;
  teams: Team[];
}

function formatTime(ms: number) {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export default function DisplayPage() {
  const [game, setGame] = useState<GameState | null>(null);
  const [timeDisplay, setTimeDisplay] = useState("12:00:00");

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const res = await fetch("/api/game");
        const data = await res.json();
        setGame(data);
      } catch (err) {
        console.error("Failed to fetch game:", err);
      }
    };
    fetchGame();
    const interval = setInterval(fetchGame, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!game) return;
    const updateTimer = () => {
      if (game.isRunning) {
        setGame((prev) =>
          prev
            ? { ...prev, remainingMs: Math.max(0, prev.remainingMs - 1000) }
            : prev
        );
      }
    };
    const id = setInterval(updateTimer, 1000);
    return () => clearInterval(id);
  }, [game?.isRunning, game?.remainingMs]);

  useEffect(() => {
    if (game) setTimeDisplay(formatTime(game.remainingMs));
  }, [game?.remainingMs]);

  if (!game) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-slate-500">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 md:p-10">
      <header className="flex justify-between items-center mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          100K Darts Challenge
        </h1>
        <div
          className={`text-4xl md:text-6xl font-mono font-bold tabular-nums ${
            game.isRunning ? "text-amber-400" : "text-slate-500"
          }`}
        >
          {game.startedAt ? timeDisplay : "12:00:00"}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
        {game.teams.map((team) => (
          <section
            key={team.id}
            className="bg-slate-900/80 rounded-2xl p-8 md:p-12 border border-slate-800"
          >
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-300 mb-4">
              {team.name}
            </h2>
            <div className="text-6xl md:text-8xl font-bold text-amber-400 font-mono tabular-nums">
              {team.remainingPoints.toLocaleString()}
            </div>
            <p className="text-slate-500 mt-2 text-lg">
              points remaining
            </p>
          </section>
        ))}
      </div>
    </main>
  );
}
