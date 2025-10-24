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

export async function DELETE(_req: Request, ctx: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await ctx.params;       
  const ok = db.deleteWorkspace?.(uuid); // 없으면 만들어주세요
  // db에 메서드가 없다면: Map.delete(uuid)로 구현
  if (!ok) return NextResponse.json({ error: "Not Found" }, { status: 404 });
  return new Response(null, { status: 204 });
}