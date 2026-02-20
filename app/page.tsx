import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-10 p-8 text-center">
      <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white drop-shadow">
        100K Darts Challenge
      </h1>
      <p className="text-xl md:text-2xl text-[#E6F5EC] max-w-2xl">
        12 hours • 2 teams • 100,000 points per board
      </p>
      <p className="text-lg md:text-xl text-[#C0E8D5] max-w-2xl">
        Getting men talking about cancer, one dart a time.
      </p>
      <div className="flex flex-wrap justify-center gap-6 mt-4">
        <Link
          href="/display"
          className="px-8 py-4 rounded-full bg-[#00A651] text-[#01210F] font-semibold shadow-lg hover:bg-[#00c765] transition-colors"
        >
          View Display
        </Link>
        <Link
          href="/scorer"
          className="px-8 py-4 rounded-full border border-[#8FE6B0] text-[#E6F5EC] font-semibold hover:bg-[#014426] transition-colors"
        >
          Scorer Login
        </Link>
      </div>
    </main>
  );
}
