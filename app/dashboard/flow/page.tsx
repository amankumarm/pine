import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Navbar } from '@/components/navbar'
import ExampleFlow from '@/components/flow/example-flow'

export default async function FlowPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="container mx-auto flex-1 px-4 py-8">
        <div className="mb-8">
          <h1 className="hero-font mb-2 text-3xl font-normal">React Flow Example</h1>
          <p className="text-sm text-muted-foreground">
            Interactive flow diagram using React Flow
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Flow Diagram</CardTitle>
            <CardDescription>Drag nodes and connect them to create your workflow</CardDescription>
          </CardHeader>
          <CardContent>
            <ExampleFlow />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

