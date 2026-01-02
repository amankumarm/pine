import { NextRequest, NextResponse } from 'next/server'
import { createFollowUpWindow } from '@/lib/services/follow-up'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const { boardId } = await params
    const body = await request.json()
    const {
      sourceWindowId,
      sourceMessageId,
      selectedText,
      title,
      positionX,
      positionY,
    } = body

    if (
      !sourceWindowId ||
      !sourceMessageId ||
      !selectedText ||
      !title ||
      positionX === undefined ||
      positionY === undefined
    ) {
      return NextResponse.json(
        {
          error:
            'sourceWindowId, sourceMessageId, selectedText, title, positionX, and positionY are required',
        },
        { status: 400 }
      )
    }

    const result = await createFollowUpWindow(
      boardId,
      sourceWindowId,
      sourceMessageId,
      selectedText,
      title,
      positionX,
      positionY
    )

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating follow-up window:', error)
    if (error instanceof Error && error.message === 'Board not found') {
      return NextResponse.json(
        { error: 'Board not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create follow-up window' },
      { status: 500 }
    )
  }
}

