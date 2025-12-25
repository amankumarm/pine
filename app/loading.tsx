import { Zap } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-white text-zinc-900">
      <div className="flex h-12 w-12 animate-pulse items-center justify-center rounded-xl bg-zinc-100 p-3">
        <Zap className="h-6 w-6 text-zinc-900" />
      </div>
      <p className="animate-pulse text-sm font-medium text-zinc-500">
        Loading Pine...
      </p>
    </div>
  );
}
