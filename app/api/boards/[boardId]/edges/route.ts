import { NextRequest, NextResponse } from 'next/server'
import { createEdge } from '@/lib/services/edges'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const { boardId } = await params
    const body = await request.json()
    const { sourceWindowId, targetWindowId, selectedText, sourceMessageId } = body

    if (!sourceWindowId || !targetWindowId || !selectedText || !sourceMessageId) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    const edge = await createEdge(
      boardId,
      sourceWindowId,
      targetWindowId,
      selectedText,
      sourceMessageId
    )
    return NextResponse.json(edge, { status: 201 })
  } catch (error) {
    console.error('Error creating edge:', error)
    if (error instanceof Error && error.message === 'Board not found') {
      return NextResponse.json(
        { error: 'Board not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create edge' },
      { status: 500 }
    )
  }
}

