"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface Team {
  id: string;
  name: string;
  remainingPoints: number;
  threeDartAverage?: number;
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
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        if (data && data.teams && Array.isArray(data.teams)) {
          setGame(data);
        }
      } catch (err) {
        console.error("Failed to fetch game:", err);
        // Set default game state on error
        setGame({
          startedAt: null,
          remainingMs: 12 * 60 * 60 * 1000,
          isRunning: false,
          teams: [
            { id: "team1", name: "Team 1", remainingPoints: 100000, threeDartAverage: 0 },
            { id: "team2", name: "Team 2", remainingPoints: 100000, threeDartAverage: 0 },
          ],
        });
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
        <p className="text-xl text-[#C0E8D5]">Loading...</p>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen p-6 md:p-10">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
        <div className="space-y-3 max-w-xl">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            100K Darts Challenge
          </h1>
          <p className="text-lg md:text-xl text-[#E6F5EC]">
            Getting men talking about cancer, one dart a time.
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div
            className={`text-4xl md:text-6xl font-mono font-bold tabular-nums px-4 py-2 rounded-lg bg-[#01210F]/70 ${
              game.isRunning ? "text-[#8FE6B0]" : "text-[#6FBF8E]"
            }`}
          >
            {game.startedAt ? timeDisplay : "12:00:00"}
          </div>
          <div className="hidden md:block">
            <Image
              src="/norton-charity-chuckers.png"
              alt="Norton Charity Chuckers"
              width={120}
              height={120}
              className="rounded-md shadow-lg"
            />
          </div>
        </div>
      </header>

      <div className="md:hidden absolute top-4 right-4">
        <Image
          src="/norton-charity-chuckers.png"
          alt="Norton Charity Chuckers"
          width={80}
          height={80}
          className="rounded-md shadow-lg"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
        {game.teams.map((team) => (
          <section
            key={team.id}
            className="bg-[#002B18]/80 rounded-2xl p-8 md:p-12 border border-[#09673B]"
          >
            <h2 className="text-2xl md:text-3xl font-semibold text-[#E6F5EC] mb-4">
              {team.name}
            </h2>
            <div className="text-6xl md:text-8xl font-bold text-[#8FE6B0] font-mono tabular-nums">
              {team.remainingPoints.toLocaleString()}
            </div>
            <p className="text-[#C0E8D5] mt-2 text-lg">
              points remaining
            </p>
            <p className="text-[#E6F5EC] mt-4 text-xl">
              3-dart avg:{" "}
              <span className="text-[#8FE6B0] font-bold">
                {team.threeDartAverage?.toFixed(1) || "0.0"}
              </span>
            </p>
          </section>
        ))}
      </div>
    </main>
  );
}
