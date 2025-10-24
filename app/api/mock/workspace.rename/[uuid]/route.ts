import { db } from "../../_db";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ uuid: string }> }
) {
  const body = await req.json().catch(() => null) as { name?: string } | null;
  if (!body?.name) {
    return new Response(JSON.stringify({ error: "name required" }), { status: 400 });
  }
  const { uuid } = await ctx.params; 
  const updated = db.renameWorkspace(uuid, body.name);
  if (!updated) {
    return new Response(JSON.stringify({ error: "Not Found" }), { status: 404 });
  }
  return new Response(null, { status: 204 }); // FE에서는 void 처리
}
