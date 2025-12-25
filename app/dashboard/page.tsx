import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getOrCreateUserBoard } from "@/lib/services/boards";
import { BoardFlowClient } from "./board-flow-client";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const board = await getOrCreateUserBoard();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div>
        
      </div>
      <main className="flex-1 overflow-hidden">
        <div className="h-full">
          <BoardFlowClient board={board} />
        </div>
      </main>
    </div>
  );
}
