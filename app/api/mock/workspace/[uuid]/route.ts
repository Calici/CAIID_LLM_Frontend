import { NextResponse } from "next/server";
import { db } from "../../_db";

export async function GET(
  _req: Request,
  ctx: { params: { uuid: string } }
) {
  const ws = db.getWorkspace(ctx.params.uuid);
  if (!ws) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }
  return NextResponse.json(ws);
}
