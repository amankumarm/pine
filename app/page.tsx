import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { getCurrentUser } from "@/lib/auth";
import { ArrowRight, GitBranch, Zap, Sparkles } from "lucide-react";

export default async function Home() {
  const user = await getCurrentUser();
  const isLoggedIn = !!user;

  return (
    <div className="flex min-h-screen flex-col bg-white text-zinc-900 selection:bg-zinc-100">
      <Navbar showAuth={!isLoggedIn} />
      
      <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-20 lg:py-32">
        {/* Background Gradients */}
        <div className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-blue-100/50 blur-[100px]" />
        <div className="pointer-events-none absolute top-20 right-20 h-[300px] w-[300px] rounded-full bg-purple-100/50 blur-[80px]" />

        <div className="z-10 container mx-auto grid max-w-6xl grid-cols-1 gap-12 items-center">
          
          {/* Left Column: Text Content */}
          <div className="flex flex-col gap-6 text-center lg:text-left items-center lg:items-center justify-center">
            <div className="inline-flex items-center gap-2 self-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-sm text-zinc-500 shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              <span>Visual AI Reasoning</span>
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl text-zinc-900">
              Don't lose the thread. <br/> Branch your ideas.
            </h1>
            
            <p className="text-lg text-zinc-500 sm:text-xl max-w-lg mx-auto lg:mx-0 text-center">
              Stop scrolling up and down. Branch any conversation into a new context creates a spatial map of your thoughts.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              {isLoggedIn ? (
                <Link href="/dashboard">
                  <Button size="lg" className="h-12 w-full rounded-full bg-zinc-900 px-8 text-white hover:bg-zinc-800 sm:w-auto">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/signup">
                    <Button size="lg" className="h-12 w-full rounded-full bg-zinc-900 px-8 text-white hover:bg-zinc-800 sm:w-auto">
                      Start Creating
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button size="lg" variant="outline" className="h-12 w-full rounded-full border-zinc-200 bg-transparent px-8 text-zinc-900 hover:bg-zinc-50 sm:w-auto">
                      Log in
                    </Button>
                  </Link>
                </>
              )}
            </div>

            <div className="mt-8 flex items-center justify-center gap-8 text-zinc-500">
              <div className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                <span className="text-sm">Infinite Branching</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                <span className="text-sm">Real-time Streaming</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
