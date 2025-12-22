import { redirect } from "next/navigation";
import { getCurrentUser, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { BoardsList } from "./boards-list";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar
        showProfile
        signOutForm={
          <form
            action={async () => {
              "use server";
              await signOut();
              redirect("/login");
            }}
          >
            <Button type="submit" variant="ghost">
              Sign out
            </Button>
          </form>
        }
      />
      <main className="container mx-auto flex-1 px-4 py-8">
        <div className="mb-8">
          <p className="text-xl ">Welcome back, {user.email}</p>
        </div>
        <BoardsList />
      </main>
    </div>
  );
}
