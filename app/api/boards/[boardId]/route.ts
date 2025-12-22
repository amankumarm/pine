import { NextRequest, NextResponse } from 'next/server'
import { getBoardById } from '@/lib/services/boards'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const { boardId } = await params
    const board = await getBoardById(boardId)
    return NextResponse.json(board)
  } catch (error) {
    console.error('Error fetching board:', error)
    if (error instanceof Error && error.message === 'Board not found') {
      return NextResponse.json(
        { error: 'Board not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to fetch board' },
      { status: 500 }
    )
  }
}

