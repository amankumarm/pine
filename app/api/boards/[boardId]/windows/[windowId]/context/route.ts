import { NextRequest, NextResponse } from 'next/server'
import { getWindowContext } from '@/lib/services/windows'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string; windowId: string }> }
) {
  try {
    const { windowId } = await params
    const window = await getWindowContext(windowId)
    return NextResponse.json(window)
  } catch (error) {
    console.error('Error fetching window context:', error)
    if (error instanceof Error && error.message === 'Window not found') {
      return NextResponse.json(
        { error: 'Window not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to fetch window context' },
      { status: 500 }
    )
  }
}

