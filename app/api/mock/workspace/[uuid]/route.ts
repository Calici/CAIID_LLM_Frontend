import { NextResponse } from "next/server";
import { db } from "../../_db";

export function GET(
  _req: Request,
  ctx: { params: { uuid: string } }
) {
  const ws = db.getWorkspace(ctx.params.uuid);
  if (!ws) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }
  return NextResponse.json(ws);
}

export function DELETE(_req: Request, ctx: { params: Promise<{ uuid: string }> }) {
  return ctx.params.then(({ uuid }) => {
    const ok = db.deleteWorkspace?.(uuid);
    if (!ok) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }
    return new Response(null, { status: 204 });
  });
}
