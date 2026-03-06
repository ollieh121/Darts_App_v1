import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function ScorerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/scorer");
  }
  return <>{children}</>;
}
