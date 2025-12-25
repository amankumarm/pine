"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";
import { GitBranch } from "lucide-react";

interface NavbarProps {
  showAuth?: boolean;
  showProfile?: boolean;
  signOutForm?: ReactNode;
}

export function Navbar({
  showAuth = false,
  showProfile = false,
  signOutForm,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2 text-xl font-bold tracking-tight text-zinc-900 hover:opacity-80 transition-opacity">
          <span className="font-[family-name:var(--font-bogle)] text-2xl uppercase tracking-wider font-[550]">Pine</span>
        </Link>
        <nav className="flex items-center gap-4">
          {showProfile && (
            <Link href="/profile">
              <Button variant="ghost" className="text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100">Profile</Button>
            </Link>
          )}
          {showAuth && (
            <>
              <Link href="/login">
                <Button variant="ghost" className="text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100">Log in</Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-zinc-900 text-white hover:bg-zinc-800">Sign up</Button>
              </Link>
            </>
          )}
          {signOutForm}
        </nav>
      </div>
    </header>
  );
}
