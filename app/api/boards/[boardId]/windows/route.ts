import { NextRequest, NextResponse } from 'next/server'
import { createChatWindow } from '@/lib/services/windows'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const { boardId } = await params
    const body = await request.json()
    const { title, positionX, positionY } = body

    if (!title || positionX === undefined || positionY === undefined) {
      return NextResponse.json(
        { error: 'Title, positionX, and positionY are required' },
        { status: 400 }
      )
    }

    const window = await createChatWindow(boardId, title, positionX, positionY)
    return NextResponse.json(window, { status: 201 })
  } catch (error) {
    console.error('Error creating chat window:', error)
    if (error instanceof Error && error.message === 'Board not found') {
      return NextResponse.json(
        { error: 'Board not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create chat window' },
      { status: 500 }
    )
  }
}

