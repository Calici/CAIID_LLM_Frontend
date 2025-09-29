"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@heroui/button";
import { Textarea } from "@heroui/input";
import { Card } from "@heroui/card";
import MarkdownTest3 from "./MarkdownTest3";

import "highlight.js/styles/github.css";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

/** ✅ 백엔드 스키마 그대로 사용 */
type Msg = { role: "user" | "ai" | "sys"; msg: string };

export default function ChatPanel() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "sys", msg: "System initialized. Messages may be logged for QA." },
    {
      role: "ai",
      msg: "Hello! Ask me anything about your files or literature.",
    },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length]);

  const send = () => {
    const text = input.trim();
    if (!text) return;

    // 1) 사용자 메시지 추가
    const nextUser: Msg = { role: "user", msg: text };
    setMessages((prev) => [...prev, nextUser]);
    setInput("");

    // 2) (데모) 어시스턴트 목업 응답
    setTimeout(() => {
      const mockAssistant: Msg = {
        role: "ai",
        msg: `You said "${text}". This is a placeholder response.`,
      };
      setMessages((prev) => [...prev, mockAssistant]);
    }, 300);

    // ⚠️ 실제 연동 시: messages에 nextUser를 합쳐서 그대로 API로 보내면 됩니다.
    // fetch("/api/chat", { method: "POST", body: JSON.stringify([...messages, nextUser]) })
    //   .then(res => res.json())
    //   .then((data: Msg[]) => setMessages(data));
  };

  const roleLabel = (role: Msg["role"]) =>
    role === "user" ? "You" : role === "ai" ? "Assistant" : "System";

  return (
    <div className="flex h-full flex-col">
      {/* 상단 히스토리 헤더 */}
      <div className="hidden items-center justify-between border-b px-4 py-3 lg:flex">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold">Chat history</h2>
          {/*<MarkdownTest3 />*/}
          <p className="truncate text-xs text-default-500">
            Messages are stored locally during development
          </p>
        </div>
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
              <Card
                key={i}
                className={`px-3 py-2 ${cls}`}
                shadow="none"
                radius="sm"
              >
                <div className="text-xs mb-1 font-medium text-default-500">
                  {roleLabel(m.role)}
                </div>
                {m.role === "ai" ? (
                  // LLM 응답에만 Markdown 적용
                  <div className="prose prose-sm max-w-none prose-pre:overflow-x-auto">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]} // GFM: ~~취소선~~, 표, 체크박스, 자동 링크 등
                      rehypePlugins={[rehypeHighlight]} // 코드블록 하이라이트
                    >
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
              // Shift+Enter → 기본 줄바꿈
            }}
          />
          <Button color="primary" onPress={send}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
