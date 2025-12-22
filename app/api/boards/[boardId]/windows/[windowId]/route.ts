import { NextRequest, NextResponse } from 'next/server'
import { updateWindowPosition } from '@/lib/services/windows'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string; windowId: string }> }
) {
  try {
    const { windowId } = await params
    const body = await request.json()
    const { positionX, positionY } = body

    if (positionX === undefined || positionY === undefined) {
      return NextResponse.json(
        { error: 'positionX and positionY are required' },
        { status: 400 }
      )
    }

    const window = await updateWindowPosition(windowId, positionX, positionY)
    return NextResponse.json(window)
  } catch (error) {
    console.error('Error updating window position:', error)
    if (error instanceof Error && error.message === 'Window not found') {
      return NextResponse.json(
        { error: 'Window not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update window position' },
      { status: 500 }
    )
  }
}

