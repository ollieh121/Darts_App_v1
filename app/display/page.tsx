"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface SupportMessage {
  id: number;
  message: string;
  created_at: string;
}

interface Team {
  id: string;
  name: string;
  remainingPoints: number;
  threeDartAverage?: number;
  last3Scores?: number[];
  count100to139?: number;
  count140to179?: number;
  count180?: number;
  estimatedMinutesRemaining?: number | null;
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

function speakScore(teamName: string, score: number) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance();
  u.text =
    score === 180
      ? `One hundred and eighty! ${teamName}`
      : score >= 140
        ? `${score}. ${teamName}`
        : `${score}. ${teamName}`;
  u.rate = score >= 140 ? 0.9 : 0.95;
  u.pitch = score === 180 ? 1.15 : 1;
  u.volume = 1;
  const voice = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith("en"));
  if (voice) u.voice = voice;
  window.speechSynthesis.speak(u);
}

function SupportMessagesSection({
  messages,
  onNewMessage,
}: {
  messages: SupportMessage[];
  onNewMessage: () => void;
}) {
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const msg = newMessage.trim();
    if (!msg || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/support-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      if (res.ok) {
        setNewMessage("");
        onNewMessage();
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="mt-10 pt-8 border-t border-[#09673B]">
      <h3 className="text-[#E6F5EC] font-semibold text-lg mb-3">Supportive messages</h3>
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value.slice(0, 500))}
          placeholder="Add a message of support..."
          maxLength={500}
          className="flex-1 px-4 py-2 bg-[#01210F] border border-[#09673B] rounded-lg text-white placeholder-[#6FBF8E]/60"
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="px-4 py-2 bg-[#00A651] text-white font-semibold rounded-lg hover:bg-[#00c765] disabled:opacity-50"
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </form>
      <div className="max-h-40 overflow-y-auto space-y-2">
        {messages.length === 0 && (
          <p className="text-[#C0E8D5] text-sm">No messages yet. Be the first!</p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className="py-2 px-3 bg-[#01210F]/80 rounded-lg text-[#E6F5EC] text-sm"
          >
            {m.message}
          </div>
        ))}
      </div>
    </section>
  );
}

function Confetti() {
  const pieces = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 2,
    color: ["#8FE6B0", "#00A651", "#E6F5EC", "#FFD700", "#FF6B6B", "#4ECDC4"][Math.floor(Math.random() * 6)],
    size: 6 + Math.random() * 8,
    rotation: Math.random() * 360,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-sm animate-confetti-fall"
          style={{
            left: `${p.left}%`,
            top: "-20px",
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
}

export default function DisplayPage() {
  const [game, setGame] = useState<GameState | null>(null);
  const [timeDisplay, setTimeDisplay] = useState("12:00:00");
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const lastAnnouncedRef = useRef<Record<string, number>>({});
  const initialLoadRef = useRef(true);

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
            { id: "team1", name: "Team 1", remainingPoints: 100000, threeDartAverage: 0, last3Scores: [], count100to139: 0, count140to179: 0, count180: 0, estimatedMinutesRemaining: null },
            { id: "team2", name: "Team 2", remainingPoints: 100000, threeDartAverage: 0, last3Scores: [], count100to139: 0, count140to179: 0, count180: 0, estimatedMinutesRemaining: null },
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

  useEffect(() => {
    const bothComplete =
      game?.teams?.length === 2 &&
      game.teams.every((t) => t.remainingPoints <= 0);
    if (bothComplete) setShowCelebration(true);
  }, [game?.teams]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch("/api/support-messages");
        if (res.ok) {
          const data = await res.json();
          setSupportMessages(data);
        }
      } catch {
        // ignore
      }
    };
    fetchMessages();
    const interval = setInterval(fetchMessages, 15000);
    return () => clearInterval(interval);
  }, []);

  // Optional: announce latest score per team when it changes (browser TTS; set NEXT_PUBLIC_ANNOUNCE_SCORES=1 to enable)
  useEffect(() => {
    if (!game || !process.env.NEXT_PUBLIC_ANNOUNCE_SCORES) return;
    game.teams.forEach((team) => {
      const latest = team.last3Scores?.[0];
      if (latest == null) return;
      const prev = lastAnnouncedRef.current[team.id];
      if (prev !== latest) {
        lastAnnouncedRef.current[team.id] = latest;
        // Only speak when we had a previous value (avoids announcing on first load)
        if (prev !== undefined) speakScore(team.name, latest);
      }
    });
    initialLoadRef.current = false;
  }, [game?.teams]);

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
          {(process.env.NEXT_PUBLIC_MCMILLAN_LOGO_URL || "/mcmillan-logo.png") && (
            <div className="flex-shrink-0 hidden sm:block">
              {(process.env.NEXT_PUBLIC_MCMILLAN_LOGO_URL || "/mcmillan-logo.png").startsWith("http") ? (
                <img
                  src={process.env.NEXT_PUBLIC_MCMILLAN_LOGO_URL}
                  alt="Macmillan Cancer Support"
                  width={80}
                  height={48}
                  className="object-contain h-10 md:h-12 w-auto"
                />
              ) : (
                <Image
                  src={process.env.NEXT_PUBLIC_MCMILLAN_LOGO_URL || "/mcmillan-logo.png"}
                  alt="Macmillan Cancer Support"
                  width={80}
                  height={48}
                  className="object-contain h-10 md:h-12 w-auto"
                />
              )}
            </div>
          )}
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

      <div className="md:hidden absolute top-4 right-4 flex items-center gap-2">
        {(process.env.NEXT_PUBLIC_MCMILLAN_LOGO_URL || "/mcmillan-logo.png") && (
          (process.env.NEXT_PUBLIC_MCMILLAN_LOGO_URL || "/mcmillan-logo.png").startsWith("http") ? (
            <img
              src={process.env.NEXT_PUBLIC_MCMILLAN_LOGO_URL}
              alt="Macmillan Cancer Support"
              width={48}
              height={28}
              className="object-contain h-7 w-auto"
            />
          ) : (
            <Image
              src={process.env.NEXT_PUBLIC_MCMILLAN_LOGO_URL || "/mcmillan-logo.png"}
              alt="Macmillan Cancer Support"
              width={48}
              height={28}
              className="object-contain h-7 w-auto"
            />
          )
        )}
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
            {team.estimatedMinutesRemaining != null && team.estimatedMinutesRemaining > 0 && (
              <p className="text-[#C0E8D5] mt-1 text-sm">
                Est. finish:{" "}
                <span className="text-[#8FE6B0] font-semibold">
                  {Math.round(team.estimatedMinutesRemaining)} min
                </span>
              </p>
            )}
            <div className="mt-4 pt-4 border-t border-[#09673B]">
              <p className="text-[#C0E8D5] text-sm mb-1">Last 3 scores</p>
              <p className="text-[#E6F5EC] font-mono text-lg">
                {team.last3Scores?.length
                  ? team.last3Scores.join(" → ")
                  : "—"}
              </p>
            </div>
            <div className="mt-3 flex gap-4 text-[#E6F5EC] flex-wrap">
              <span className="bg-[#01210F] px-3 py-1 rounded">
                100+: <strong className="text-[#8FE6B0]">{team.count100to139 ?? 0}</strong>
              </span>
              <span className="bg-[#01210F] px-3 py-1 rounded">
                140+: <strong className="text-[#8FE6B0]">{team.count140to179 ?? 0}</strong>
              </span>
              <span className="bg-[#01210F] px-3 py-1 rounded">
                180: <strong className="text-[#8FE6B0]">{team.count180 ?? 0}</strong>
              </span>
            </div>
          </section>
        ))}
      </div>

      <section className="mt-10 pt-8 border-t border-[#09673B] flex flex-col sm:flex-row items-center justify-center gap-6">
        <div className="text-center sm:text-left">
          <p className="text-[#E6F5EC] font-semibold text-lg mb-1">Support the challenge</p>
          <p className="text-[#C0E8D5] text-sm mb-2">Scan to donate while you watch</p>
          <p className="text-[#E6F5EC] text-sm mb-3 max-w-sm">
            Thank you for donating. If you haven’t yet, any contributions would be greatly appreciated.
          </p>
          {process.env.NEXT_PUBLIC_DONATE_URL ? (
            <a
              href={process.env.NEXT_PUBLIC_DONATE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-5 py-2.5 bg-[#00A651] text-white font-semibold rounded-full hover:bg-[#00c765] transition-colors"
            >
              Donate now
            </a>
          ) : (
            <span className="inline-block px-5 py-2.5 bg-[#09673B] text-[#C0E8D5] font-semibold rounded-full cursor-default">
              Donate now
            </span>
          )}
        </div>
        <div className="flex-shrink-0 bg-white p-2 rounded-lg">
          {process.env.NEXT_PUBLIC_DONATE_URL ? (
            <a
              href={process.env.NEXT_PUBLIC_DONATE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
              aria-label="Scan or click to open donation page"
            >
              <Image
                src="/scan-to-donate-qr.png"
                alt="QR code – scan to donate"
                width={160}
                height={160}
                className="rounded"
              />
            </a>
          ) : (
            <Image
              src="/scan-to-donate-qr.png"
              alt="QR code – scan to donate"
              width={160}
              height={160}
              className="rounded"
            />
          )}
        </div>
      </section>

      <SupportMessagesSection
        messages={supportMessages}
        onNewMessage={() => {
          fetch("/api/support-messages")
            .then((r) => r.ok && r.json())
            .then((data) => data && setSupportMessages(data))
            .catch(() => {});
        }}
      />

      <section className="mt-10 pt-8 border-t border-[#09673B] text-center">
        <p className="text-[#E6F5EC] font-semibold text-lg mb-4">
          Huge thank you to our sponsors Bully Darts and Mac Electrical — fantastic local, family-run businesses and services.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          <Image
            src="/bully-darts.png"
            alt="Bully Darts"
            width={140}
            height={56}
            className="object-contain h-12 md:h-14 w-auto"
          />
          <Image
            src="/mac-electrical.png"
            alt="Mac Electrical"
            width={120}
            height={72}
            className="object-contain h-12 md:h-14 w-auto"
          />
        </div>
      </section>

      {showCelebration && (
        <>
          <Confetti />
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-6">
            <div className="bg-[#002B18] border-2 border-[#00A651] rounded-2xl p-8 md:p-12 max-w-lg text-center shadow-2xl">
              <h2 className="text-2xl md:text-3xl font-bold text-[#8FE6B0] mb-4">
                Congratulations!
              </h2>
              <p className="text-[#E6F5EC] text-lg leading-relaxed">
                You’ve helped raise an amazing amount of money for Macmillan, which will encourage men to start talking about cancer, one dart at a time.
              </p>
              <button
                type="button"
                onClick={() => setShowCelebration(false)}
                className="mt-6 px-6 py-3 bg-[#00A651] text-white font-semibold rounded-full hover:bg-[#00c765]"
              >
                Dismiss
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
