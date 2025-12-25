import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-white text-zinc-900">
      <h2 className="text-4xl font-bold tracking-tight">404</h2>
      <p className="text-zinc-500">Could not find requested resource</p>
      <Link href="/">
        <Button variant="outline">Return Home</Button>
      </Link>
    </div>
  );
}
