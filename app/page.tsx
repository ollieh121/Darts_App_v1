import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-12 p-8">
      <h1 className="text-5xl font-bold tracking-tight text-center">
        100K Darts Challenge
      </h1>
      <p className="text-xl text-slate-400 text-center max-w-md">
        12 hours • 2 teams • 100,000 points per board
      </p>
      <div className="flex gap-6">
        <Link
          href="/display"
          className="px-8 py-4 bg-amber-500 text-slate-950 font-semibold rounded-lg hover:bg-amber-400 transition-colors"
        >
          View Display
        </Link>
        <Link
          href="/scorer"
          className="px-8 py-4 border border-slate-600 text-slate-200 font-semibold rounded-lg hover:bg-slate-800 transition-colors"
        >
          Scorer Login
        </Link>
      </div>
    </main>
  );
}
