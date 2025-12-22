import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getBoardById } from '@/lib/services/boards'
import { Navbar } from '@/components/navbar'
import { BoardFlowClient } from './board-flow-client'

export default async function BoardPage({
  params,
}: {
  params: Promise<{ boardId: string }>
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const { boardId } = await params

  let board
  try {
    board = await getBoardById(boardId)
  } catch (error) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar showDashboard />
      <main className="flex-1 overflow-hidden">
        <div className="h-full">
          <BoardFlowClient board={board} />
        </div>
      </main>
    </div>
  )
}

