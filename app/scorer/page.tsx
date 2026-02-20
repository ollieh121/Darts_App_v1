"use client";

import { signOut } from "next-auth/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";

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
            { id: "team1", name: "Team 1", remainingPoints: 100000, threeDartAverage: 0 },
            { id: "team2", name: "Team 2", remainingPoints: 100000, threeDartAverage: 0 },
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
    const score = parseInt(scoreInput.trim(), 10);
    if (isNaN(score) || score < 0 || score > 180) {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
      return;
    }
    setStatus("idle");
    try {
      const res = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: selectedTeam, score }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Failed to add score" }));
        setStatus("error");
        console.error("Score error:", errorData);
        setTimeout(() => setStatus("idle"), 3000);
        return;
      }
      setScoreInput("");
      setStatus("success");
      setTimeout(() => setStatus("idle"), 2000);
      await fetchGame();
    } catch (err) {
      console.error("Score submission error:", err);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  async function handleStart() {
    try {
      const res = await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Failed to start timer" }));
        const errorMsg = errorData.error || "Database not connected. Please check your database setup.";
        const details = errorData.details ? `\n\nDetails: ${errorData.details}` : "";
        alert(`Failed to start timer: ${errorMsg}${details}`);
        return;
      }
      await fetchGame();
    } catch (err) {
      console.error("Failed to start:", err);
      alert("Failed to start timer. Please check the console for details.");
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
        <p className="text-xl text-[#C0E8D5]">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 max-w-4xl mx-auto">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Scorer</h1>
          <p className="text-sm text-[#C0E8D5]">
            Getting men talking about cancer, one dart a time.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[#E6F5EC] font-mono px-3 py-1 rounded-lg bg-[#01210F]/70">
            {game.startedAt ? formatTime(game.remainingMs) : "12:00:00"}
          </span>
          <Link
            href="/display"
            className="text-[#8FE6B0] hover:text-white text-sm underline-offset-4 hover:underline"
          >
            View display
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-[#C0E8D5] hover:text-white text-sm"
          >
            Sign out
          </button>
          <div className="hidden md:block">
            <Image
              src="/norton-charity-chuckers.png"
              alt="Norton Charity Chuckers"
              width={80}
              height={80}
              className="rounded-md shadow-lg"
            />
          </div>
        </div>
      </header>

      <div className="md:hidden absolute top-4 right-4">
        <Image
          src="/norton-charity-chuckers.png"
          alt="Norton Charity Chuckers"
          width={70}
          height={70}
          className="rounded-md shadow-lg"
        />
      </div>

      {!game.startedAt && (
        <div className="mb-8 p-4 bg-[#00A651]/15 rounded-lg border border-[#8FE6B0]">
          <p className="text-[#E6F5EC] mb-3">
            The 12-hour timer has not started yet.
          </p>
          <button
            onClick={handleStart}
            className="px-4 py-2 bg-[#00A651] text-[#01210F] font-semibold rounded-full hover:bg-[#00c765]"
          >
            Start timer
          </button>
        </div>
      )}

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[#E6F5EC] mb-4">
          Add score
        </h2>
        <form
          onSubmit={handleAddScore}
          className="flex flex-wrap gap-4 items-end bg-[#002B18]/70 border border-[#09673B] rounded-xl p-4"
        >
          <div>
            <label className="block text-sm text-[#C0E8D5] mb-1">Team</label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="px-4 py-3 bg-[#01210F] border border-[#09673B] rounded-lg text-white"
            >
              {game.teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.remainingPoints.toLocaleString()} left)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-[#C0E8D5] mb-1">
              Score (0–180)
            </label>
            <input
              type="number"
              min={0}
              max={180}
              value={scoreInput}
              onChange={(e) => setScoreInput(e.target.value)}
              placeholder="e.g. 60"
              className="px-4 py-3 bg-[#01210F] border border-[#09673B] rounded-lg text-white w-28"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-[#00A651] text-[#01210F] font-semibold rounded-full hover:bg-[#00c765]"
          >
            Add
          </button>
        </form>
        {status === "success" && (
          <p className="text-[#8FE6B0] mt-2 text-sm">Score added.</p>
        )}
        {status === "error" && (
          <p className="text-red-300 mt-2 text-sm">
            Invalid score (0–180) or database error. Check console for details.
          </p>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[#E6F5EC] mb-4">
          Current totals
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {game.teams.map((t) => (
            <div
              key={t.id}
              className="p-4 bg-[#002B18] rounded-lg border border-[#09673B]"
            >
              <p className="text-[#C0E8D5] text-sm">{t.name}</p>
              <p className="text-3xl font-bold text-[#8FE6B0] font-mono">
                {t.remainingPoints.toLocaleString()}
              </p>
              <p className="text-[#C0E8D5] text-sm mt-2">
                3-dart avg:{" "}
                <span className="text-white font-semibold">
                  {t.threeDartAverage?.toFixed(1) || "0.0"}
                </span>
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-12 pt-8 border-t border-[#09673B]">
        <button
          onClick={handleReset}
          className="text-[#C0E8D5] hover:text-red-300 text-sm"
        >
          Reset game
        </button>
      </div>
    </main>
  );
}
