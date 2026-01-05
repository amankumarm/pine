import { NextRequest, NextResponse } from 'next/server'
import { updateWindowPosition, updateWindowTitle, updateWindowModel } from '@/lib/services/windows'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string; windowId: string }> }
) {
  try {
    const { windowId } = await params
    const body = await request.json()
    const { positionX, positionY, title, modelId } = body

    // Handle position update
    if (positionX !== undefined && positionY !== undefined) {
      const window = await updateWindowPosition(windowId, positionX, positionY)
      return NextResponse.json(window)
    }

    // Handle title update
    if (title !== undefined) {
      const window = await updateWindowTitle(windowId, title)
      return NextResponse.json(window)
    }

    // Handle model update
    if (modelId !== undefined) {
      const window = await updateWindowModel(windowId, modelId)
      return NextResponse.json(window)
    }

    return NextResponse.json(
      { error: 'Either positionX/positionY, title, or modelId must be provided' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating window:', error)
    if (error instanceof Error && error.message === 'Window not found') {
      return NextResponse.json(
        { error: 'Window not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update window' },
      { status: 500 }
    )
  }
}

