"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@heroui/button";
import { Textarea } from "@heroui/input";
import { Card } from "@heroui/card";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";

/** ✅ 백엔드 스키마 그대로 사용 */
type Msg = { role: "user" | "ai" | "sys"; msg: string };

export default function ChatPanel() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "sys", msg: "System initialized. Messages may be logged for QA." },
    { role: "ai", msg: "Hello! Ask me anything about your files or literature." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    // 1) 사용자 메시지 + AI placeholder 추가
    const userMsg: Msg = { role: "user", msg: text };
    setMessages((prev) => [...prev, userMsg, { role: "ai", msg: "" }]);
    setInput("");
    setLoading(true);

    // 2) API 키 확인 (개발용: localStorage에서 가져와 헤더로 전달)
    const apiKey =
      typeof window !== "undefined" ? localStorage.getItem("openai_api_key") : null;

    if (!apiKey) {
      // 마지막 AI 메시지를 키 경고로 치환
      setMessages((prev) => {
        const next = [...prev];
        const last = next.length - 1;
        if (last >= 0 && next[last].role === "ai") {
          next[last] = {
            role: "ai",
            msg: "⚠️ Missing API key. Open Settings and save your OpenAI key.",
          };
        }
        return next;
      });
      setLoading(false);
      return;
    }

    // 3) 서버 라우트로 스트리밍 요청
    try {
      const payload = { messages: [...messages, userMsg] /* model/baseUrl 옵션 필요 시 추가 */ };

      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-openai-key": apiKey, // 운영에선 제거하고 서버 ENV 사용 권장
        },
        body: JSON.stringify(payload),
      });

      if (!resp.ok || !resp.body) {
        throw new Error(`HTTP ${resp.status}`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder("utf-8");

      let aiText = "";

      // 4) SSE 스트림 파싱 → delta.content 이어붙이기
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);

        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (data === "[DONE]") continue;
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content ?? "";
            if (delta) {
              aiText += delta;
              // 마지막 AI 메시지 업데이트
              setMessages((prev) => {
                const next = [...prev];
                const last = next.length - 1;
                if (last >= 0 && next[last].role === "ai") {
                  next[last] = { role: "ai", msg: aiText };
                }
                return next;
              });
            }
          } catch {
            // keep-alive 등 비JSON 라인은 무시
          }
        }
      }
    } catch (err: any) {
      setMessages((prev) => {
        const next = [...prev];
        const last = next.length - 1;
        if (last >= 0 && next[last].role === "ai") {
          next[last] = {
            role: "ai",
            msg: `❌ Request failed: ${err?.message ?? "unknown error"}`,
          };
        }
        return next;
      });
    } finally {
      setLoading(false);
    }
  };

  const roleLabel = (role: Msg["role"]) =>
    role === "user" ? "You" : role === "ai" ? "Assistant" : "System";

  return (
    <div className="flex h-full flex-col">
      {/* 상단 히스토리 헤더 */}
      <div className="hidden items-center justify-between border-b px-4 py-3 lg:flex">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold">Chat history</h2>
          <p className="truncate text-xs text-default-500">
            Messages are stored locally during development
          </p>
        </div>
        <div className="text-xs text-default-500">{loading ? "Streaming..." : ""}</div>
      </div>

      {/* 채팅 히스토리 영역 */}
      <div ref={scrollRef} className="flex-1 overflow-auto p-4">
        <div className="mx-auto max-w-3xl space-y-3">
          {messages.map((m, i) => {
            const cls =
              m.role === "user"
                ? "bg-content2"
                : m.role === "ai"
                ? "bg-content1"
                : "bg-default-50 border border-dashed";
            return (
              <Card key={i} className={`px-3 py-2 ${cls}`} shadow="none" radius="sm">
                <div className="text-xs mb-1 font-medium text-default-500">
                  {roleLabel(m.role)}
                </div>
                {m.role === "ai" ? (
                  // LLM 응답에만 Markdown 적용
                  <div className="prose prose-sm max-w-none prose-pre:overflow-x-auto">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                      {m.msg}
                    </ReactMarkdown>
                  </div>
                ) : (
                  // 사용자/시스템 메시지는 평문 유지
                  <div className="whitespace-pre-wrap text-sm">{m.msg}</div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* 하단 입력창 */}
      <div className="border-t p-3">
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <Textarea
            minRows={1}
            maxRows={8}
            value={input}
            onValueChange={setInput}
            placeholder="Type your message... (Enter: Send, Shift+Enter: New line)"
            className="flex-1"
            variant="bordered"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault(); // 줄바꿈 방지
                send();
              }
            }}
            isDisabled={loading}
          />
          <Button color="primary" onPress={send} isDisabled={loading}>
            {loading ? "Sending..." : "Send"}
          </Button>
        </div>
      </div>
    </div>
  );
}
