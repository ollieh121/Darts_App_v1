"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface Team {
  id: string;
  name: string;
  remainingPoints: number;
  threeDartAverage?: number;
  last3Scores?: number[];
  count100?: number;
  count140?: number;
  count180?: number;
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
            { id: "team1", name: "Team 1", remainingPoints: 100000, threeDartAverage: 0, last3Scores: [], count100: 0, count140: 0, count180: 0 },
            { id: "team2", name: "Team 2", remainingPoints: 100000, threeDartAverage: 0, last3Scores: [], count100: 0, count140: 0, count180: 0 },
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
        <div className="flex items-center gap-4 md:gap-6">
          <div className="flex-shrink-0">
            <Image
              src="/mac-electrical.png"
              alt="Mac Electrical"
              width={100}
              height={60}
              className="object-contain h-12 md:h-14 w-auto"
            />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white">
              Live Score Update
            </h1>
            <p className="text-base md:text-lg text-[#E6F5EC]">
              Getting men talking about cancer, one dart a time.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 md:gap-6">
          <div
            className={`text-3xl md:text-5xl font-mono font-bold tabular-nums px-4 py-2 rounded-lg bg-[#01210F]/70 ${
              game.isRunning ? "text-[#8FE6B0]" : "text-[#6FBF8E]"
            }`}
          >
            {game.startedAt ? timeDisplay : "12:00:00"}
          </div>
          <div className="hidden md:block">
            <Image
              src="/norton-charity-chuckers.png"
              alt="Norton Charity Chuckers"
              width={100}
              height={100}
              className="rounded-md shadow-lg object-contain"
            />
          </div>
        </div>
      </header>

      <div className="md:hidden absolute top-4 right-4">
        <Image
          src="/norton-charity-chuckers.png"
          alt="Norton Charity Chuckers"
          width={64}
          height={64}
          className="rounded-md shadow-lg object-contain"
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
            <div className="mt-4 pt-4 border-t border-[#09673B]">
              <p className="text-[#C0E8D5] text-sm mb-1">Last 3 scores</p>
              <p className="text-[#E6F5EC] font-mono text-lg">
                {team.last3Scores?.length
                  ? team.last3Scores.join(" → ")
                  : "—"}
              </p>
            </div>
            <div className="mt-3 flex gap-4 text-[#E6F5EC]">
              <span className="bg-[#01210F] px-3 py-1 rounded">
                100: <strong className="text-[#8FE6B0]">{team.count100 ?? 0}</strong>
              </span>
              <span className="bg-[#01210F] px-3 py-1 rounded">
                140: <strong className="text-[#8FE6B0]">{team.count140 ?? 0}</strong>
              </span>
              <span className="bg-[#01210F] px-3 py-1 rounded">
                180: <strong className="text-[#8FE6B0]">{team.count180 ?? 0}</strong>
              </span>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
