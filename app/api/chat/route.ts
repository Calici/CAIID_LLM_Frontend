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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      messages: Msg[];
      model?: string;
      baseUrl?: string;
    };

    // 1) API 키 받기: (A) 헤더로 전달한 개발용, (B) 환경변수(권장)
    const clientKey =
      req.headers.get("x-openai-key") ?? process.env.OPENAI_API_KEY;
    if (!clientKey) {
      return new Response("Missing OpenAI API key", { status: 401 });
    }

    const baseUrl = body.baseUrl || process.env.OPENAI_BASE_URL || FALLBACK_BASE_URL;
    const model = body.model || process.env.OPENAI_MODEL || FALLBACK_MODEL;

    // 2) OpenAI(Chat Completions) 호출 - 스트리밍
    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${clientKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        stream: true,
        messages: mapMessages(body.messages),
      }),
    });

    if (!resp.ok || !resp.body) {
      const text = await resp.text().catch(() => "");
      return new Response(`Upstream error: ${resp.status} ${text}`, { status: 500 });
    }

    // 3) OpenAI의 SSE 스트림을 그대로 클라이언트로 전달
    return new Response(resp.body, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        // CORS가 필요하면 아래 추가
        // "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e: any) {
    return new Response(`Server error: ${e?.message ?? "unknown"}`, { status: 500 });
  }
}
