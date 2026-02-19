"use client";

import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

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

export default function ScorerPage() {
  const [game, setGame] = useState<GameState | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string>("team1");
  const [scoreInput, setScoreInput] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

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
          { id: "team1", name: "Team 1", remainingPoints: 100000 },
          { id: "team2", name: "Team 2", remainingPoints: 100000 },
        ],
      });
    }
  };

  useEffect(() => {
    fetchGame();
    const interval = setInterval(fetchGame, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!game?.isRunning) return;
    const id = setInterval(() => {
      setGame((prev) =>
        prev ? { ...prev, remainingMs: Math.max(0, prev.remainingMs - 1000) } : prev
      );
    }, 1000);
    return () => clearInterval(id);
  }, [game?.isRunning]);

  async function handleAddScore(e: React.FormEvent) {
    e.preventDefault();
    const score = parseInt(scoreInput, 10);
    if (isNaN(score) || score < 0 || score > 180) {
      setStatus("error");
      return;
    }
    setStatus("idle");
    try {
      const res = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: selectedTeam, score }),
      });
      if (!res.ok) throw new Error("Failed");
      setScoreInput("");
      setStatus("success");
      fetchGame();
    } catch {
      setStatus("error");
    }
  }

  async function handleStart() {
    try {
      await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
      fetchGame();
    } catch (err) {
      console.error("Failed to start:", err);
    }
  }

  async function handleReset() {
    if (!confirm("Reset the entire game? This cannot be undone.")) return;
    try {
      await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      fetchGame();
    } catch (err) {
      console.error("Failed to reset:", err);
    }
  }

  if (!game) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-slate-500">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 max-w-4xl mx-auto">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Scorer</h1>
        <div className="flex items-center gap-4">
          <span className="text-slate-400 font-mono">
            {game.startedAt ? formatTime(game.remainingMs) : "12:00:00"}
          </span>
          <Link
            href="/display"
            className="text-amber-400 hover:text-amber-300 text-sm"
          >
            View display
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-slate-500 hover:text-slate-300 text-sm"
          >
            Sign out
          </button>
        </div>
      </header>

      {!game.startedAt && (
        <div className="mb-8 p-4 bg-amber-500/20 rounded-lg border border-amber-500/40">
          <p className="text-amber-200 mb-3">The 12-hour timer has not started yet.</p>
          <button
            onClick={handleStart}
            className="px-4 py-2 bg-amber-500 text-slate-950 font-semibold rounded-lg hover:bg-amber-400"
          >
            Start timer
          </button>
        </div>
      )}

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-slate-300 mb-4">Add score</h2>
        <form onSubmit={handleAddScore} className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm text-slate-500 mb-1">Team</label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
            >
              {game.teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.remainingPoints.toLocaleString()} left)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-500 mb-1">Score (0–180)</label>
            <input
              type="number"
              min={0}
              max={180}
              value={scoreInput}
              onChange={(e) => setScoreInput(e.target.value)}
              placeholder="e.g. 60"
              className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white w-28"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-amber-500 text-slate-950 font-semibold rounded-lg hover:bg-amber-400"
          >
            Add
          </button>
        </form>
        {status === "success" && (
          <p className="text-green-400 mt-2 text-sm">Score added.</p>
        )}
        {status === "error" && (
          <p className="text-red-400 mt-2 text-sm">Invalid score (0–180).</p>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-300 mb-4">Current totals</h2>
        <div className="grid grid-cols-2 gap-4">
          {game.teams.map((t) => (
            <div
              key={t.id}
              className="p-4 bg-slate-900 rounded-lg border border-slate-800"
            >
              <p className="text-slate-400 text-sm">{t.name}</p>
              <p className="text-3xl font-bold text-amber-400 font-mono">
                {t.remainingPoints.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-12 pt-8 border-t border-slate-800">
        <button
          onClick={handleReset}
          className="text-slate-500 hover:text-red-400 text-sm"
        >
          Reset game
        </button>
      </div>
    </main>
  );
}
