// app/api/chat/route.ts
import { NextRequest } from "next/server";

export const runtime = "edge";

// 개발/테스트: 클라에서 전달한 키/엔드포인트/모델을 허용
// 실서비스: 아래 3가지는 process.env.* 로 고정해서 쓰세요.
const FALLBACK_BASE_URL = "https://api.openai.com/v1";
const FALLBACK_MODEL = "gpt-4o-mini"; // 또는 gpt-4o-mini, gpt-4o, etc.

type Msg = { role: "user" | "ai" | "sys"; msg: string };

function mapMessages(msgs: Msg[]) {
  return msgs.map((m) => ({
    role: m.role === "ai" ? "assistant" : m.role === "sys" ? "system" : "user",
    content: m.msg,
  }));
}

export function POST(req: NextRequest) {
  return req
    .json()
    .then((body: {
      messages: Msg[];
      model?: string;
      baseUrl?: string;
    }) => {
      const clientKey =
        req.headers.get("x-openai-key") ?? process.env.OPENAI_API_KEY;

      if (!clientKey) {
        return new Response("Missing OpenAI API key", { status: 401 });
      }

      const baseUrl = body.baseUrl || process.env.OPENAI_BASE_URL || FALLBACK_BASE_URL;
      const model = body.model || process.env.OPENAI_MODEL || FALLBACK_MODEL;

      return fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${clientKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          stream: true,
          messages: mapMessages(body.messages),
        }),
      }).then((resp) => {
        if (!resp.ok || !resp.body) {
          return resp
            .text()
            .catch(() => "")
            .then((text) =>
              new Response(`Upstream error: ${resp.status} ${text}`, {
                status: 500,
              }),
            );
        }

        return new Response(resp.body, {
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
          },
        });
      });
    })
    .catch((e: any) =>
      new Response(`Server error: ${e?.message ?? "unknown"}`, {
        status: 500,
      }),
    );
}
