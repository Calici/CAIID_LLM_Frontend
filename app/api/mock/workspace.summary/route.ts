import { NextResponse } from "next/server";
import { db } from "../_db";

export function GET() {
  return NextResponse.json(db.listSummaries());
}
