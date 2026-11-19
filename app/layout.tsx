import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "./login/actions";
import "./globals.css";

export const metadata: Metadata = {
  title: "Interview Prep",
  description: "JavaScript interview practice",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  return (
    <html lang="en" data-theme="light">
      <body className="min-h-screen bg-base-200">
        <nav className="navbar bg-base-100 shadow-sm px-2 sm:px-4">
          <div className="flex-1">
            <Link href="/syllabus" className="btn btn-ghost text-lg px-2">Interview Prep</Link>
          </div>
          {data?.claims && (
            <div className="flex items-center gap-1">
              <Link href="/syllabus" className="btn btn-ghost btn-sm">Syllabus</Link>
              <Link href="/coding" className="btn btn-ghost btn-sm">Coding</Link>
              <Link href="/mistakes" className="btn btn-ghost btn-sm hidden sm:inline-flex">Mistakes</Link>
              <Link href="/history" className="btn btn-ghost btn-sm hidden sm:inline-flex">History</Link>
              <form action={logout}>
                <button className="btn btn-outline btn-sm">Log out</button>
              </form>
            </div>
          )}
        </nav>
        <main className="max-w-3xl mx-auto p-4">{children}</main>
      </body>
    </html>
  );
}
