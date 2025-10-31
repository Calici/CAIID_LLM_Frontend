import { db } from "../../_db";

export function POST(
  req: Request,
  ctx: { params: Promise<{ uuid: string }> }
) {
  return Promise.all([
    req.json().catch(() => null) as Promise<{ name?: string } | null>,
    ctx.params,
  ]).then(([body, { uuid }]) => {
    if (!body?.name) {
      return new Response(JSON.stringify({ error: "name required" }), {
        status: 400,
      });
    }

    const updated = db.renameWorkspace(uuid, body.name);
    if (!updated) {
      return new Response(JSON.stringify({ error: "Not Found" }), {
        status: 404,
      });
    }

    return new Response(null, { status: 204 });
  });
}
