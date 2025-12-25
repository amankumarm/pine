import { NextResponse } from "next/server";
import { getOrCreateUserBoard } from "@/lib/services/boards";

export async function GET() {
  try {
    const board = await getOrCreateUserBoard();
    return NextResponse.json(board);
  } catch (error) {
    console.error("Error fetching board:", error);
    return NextResponse.json(
      { error: "Failed to fetch board" },
      { status: 500 }
    );
  }
}
