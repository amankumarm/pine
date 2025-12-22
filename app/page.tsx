import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentUser();
  const isLoggedIn = !!user;

  return (
    <div className="flex min-h-screen flex-col bg-">
      <Navbar showAuth={!isLoggedIn} showDashboard={isLoggedIn} />
      {/* Hero Section */}
      <div className="mx-auto text-center flex-1 grid place-content-center">
        <h1 className="mb-4 text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
          Branch AI conversations visually
        </h1>
        <p className="prose mx-auto text-sm mb-10 text-muted-foreground md:text-xl">
          Create multiple chat windows on a canvas. Branch any response into new
          conversations. See how your ideas connect and diverge.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          {isLoggedIn ? (
            <Link href="/dashboard">
              <Button size="lg" className="px-8">
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/signup">
                <Button size="lg" className="px-8">
                  Get started
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="px-8">
                  Log in
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
