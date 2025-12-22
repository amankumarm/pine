import { redirect } from "next/navigation";
import { getCurrentUser, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Navbar } from "@/components/navbar";
import Link from "next/link";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar
        showDashboard
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
          <h2 className="hero-font text-3xl font-normal">Profile</h2>
          <p className="text-sm text-muted-foreground">
            Manage your account information
          </p>
        </div>
        <div className=" max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Email
                </label>
                <p className="mt-1 text-sm">{user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  User ID
                </label>
                <p className="mt-1 text-xs font-mono">{user.id}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
