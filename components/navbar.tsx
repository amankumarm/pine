"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

interface NavbarProps {
  showAuth?: boolean;
  showDashboard?: boolean;
  showProfile?: boolean;
  signOutForm?: ReactNode;
}

export function Navbar({
  showAuth = false,
  showDashboard = false,
  showProfile = false,
  signOutForm,
}: NavbarProps) {
  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-semibold">
          Echo
        </Link>
        <nav className="flex items-center gap-4">
          {showDashboard && (
            <Link href="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
          )}
          {showProfile && (
            <Link href="/profile">
              <Button variant="ghost">Profile</Button>
            </Link>
          )}
          {showAuth && (
            <>
              <Link href="/login">
                <Button variant="ghost">Log in</Button>
              </Link>
              <Link href="/signup">
                <Button>Sign up</Button>
              </Link>
            </>
          )}
          {signOutForm}
        </nav>
      </div>
    </header>
  );
}

