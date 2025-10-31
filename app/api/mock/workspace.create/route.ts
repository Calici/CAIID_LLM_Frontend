import { NextResponse } from "next/server";
import { db } from "../_db";

export function POST(req: Request) {
  return req
    .json()
    .catch(() => null as { name?: string; user_prompt?: string } | null)
    .then((body) => {
      if (!body?.user_prompt) {
        return NextResponse.json({ error: "user_prompt required" }, { status: 400 });
      }

      const ws = db.createWorkspace({ name: body.name, user_prompt: body.user_prompt });
      return NextResponse.json(ws, { status: 201 });
    });
}
