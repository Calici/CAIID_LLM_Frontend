"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@heroui/button";
import { Textarea } from "@heroui/input";
import { Card } from "@heroui/card";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";
import { postChatStream } from "@/app/api/chatStream";
import { listWorkspaces } from "@/app/api/wrappers";
import {
  ModelResponseT,
  ToolCallT,
  getWorkspace,
  MessageT,
} from "@/app/api/wrappers";
/** ✅ 백엔드 스키마 그대로 사용 */
type Msg = { role: "user" | "ai" | "sys"; msg: string };

type ChatPanelProps = {
  // workspaceUuid: string | null; // null이면 새로 만들 모드
  // onWorkspaceCreated?: (uuid: string) => void;
  uuid: string | null,
  messages: MessageT[]
  sendMessage: (msg: string, uuid: string | null) => void
};

export default function ChatPanel({
  // workspaceUuid,
  // onWorkspaceCreated,
  uuid,
  messages, 
  sendMessage
}: ChatPanelProps) {
  // const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  // const [loading, setLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length]);

  // useEffect(() => {
  //   // 선택된 워크스페이스가 있으면 서버에서 히스토리 로드
  //   // 없으면(=새 채팅 모드) 초기 메세지 유지
  //   if (workspaceUuid === null){ setMessages([]); return; }

  //   let cancelled = false;
  //   (async () => {
  //     try {
  //       const ws = await getWorkspace(workspaceUuid);
  //       // ws.chat_history.messages: MessageT[] -> 우리 Msg[]로 변환
  //       const mapped: Msg[] = ws.chat_history.messages.map((m: MessageT) => {
  //         if (m.type === "user") return { role: "user", msg: m.content };
  //         if (m.type === "ai") return { role: "ai", msg: m.content };
  //         // tool_call은 간단히 시스템 라벨로 보여주거나 숨길 수 있어요
  //         return {
  //           role: "sys",
  //           msg: `[tool_call] ${m.tool_name ?? ""} (${m.tool_id ?? ""})`,
  //         };
  //       });
  //       if (!cancelled) {
  //         setMessages(
  //           mapped.length
  //             ? mapped
  //             : [{ role: "sys", msg: "Loaded history (empty)." }]
  //         );
  //       }
  //     } catch (e) {
  //       if (!cancelled) {
  //         setMessages([{ role: "sys", msg: "⚠️ Failed to load history." }]);
  //       }
  //     }
  //   })();
  //   return () => {
  //     cancelled = true;
  //   };
  // }, [workspaceUuid]);

  // const send = async () => {
  //   const text = input.trim();
  //   if (!text || loading) return;

  //   // 메시지 추가/UI는 기존 로직 재사용
  //   setMessages((prev) => [
  //     ...prev,
  //     { role: "user", msg: text },
  //     { role: "ai", msg: "" },
  //   ]);
  //   setInput("");
  //   setLoading(true);

  //   try {
  //     let aiText = "";

  //     await postChatStream(
  //       { user_prompt: text, uuid: workspaceUuid ?? undefined },
  //       {
  //         onChat: (chatEvt: ModelResponseT) => {
  //           // {type:'ai'|'tool_call'...} 중 'ai'만 텍스트를 이어붙이는 식으로 처리
  //           if (chatEvt.type === "ai") {
  //             aiText += chatEvt.content ?? "";
  //             setMessages((prev) => {
  //               const next = [...prev];
  //               const last = next.length - 1;
  //               if (last >= 0 && next[last].role === "ai") {
  //                 next[last] = { role: "ai", msg: aiText };
  //               }
  //               return next;
  //             });
  //           } else if (chatEvt.type === "tool_call") {
  //             console.log("@@@@ tool call invoked");
  //             // tool call invoke
  //           }
  //         },
  //         onRecord: (name, uuid) => {
  //           console.log(
  //             `@@@@@ onRecord Invoked / name: ${name}, uuid: ${uuid}`
  //           );
  //           if (!workspaceUuid) {
  //             onWorkspaceCreated?.(uuid);
  //           }
  //         },
  //         onQuery: (pubList) => {
  //           console.log(`@@@@@ onQuery Invoked / name: ${pubList}`, pubList);
  //         },
  //         // onError: (e) => {
  //         //   setMessages(prev => {
  //         //     const next = [...prev];
  //         //     const last = next.length - 1;
  //         //     if (last >= 0 && next[last].role === "ai") {
  //         //       next[last] = {
  //         //         role: "ai",
  //         //         msg: `❌ Request failed: ${e instanceof Error ? e.message : String(e)}`,
  //         //       };
  //         //     }
  //         //     return next;
  //         //   });
  //         // },
  //       }
  //     );
  //   } catch (e) {
  //     setMessages((prev) => {
  //       const next = [...prev];
  //       const last = next.length - 1;
  //       if (last >= 0 && next[last].role === "ai") {
  //         next[last] = {
  //           role: "ai",
  //           msg: `❌ Request failed: ${e instanceof Error ? e.message : String(e)}`,
  //         };
  //       }
  //       return next;
  //     });
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const roleLabel = (role: "user" | "ai" | "tool_call") =>
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
        <div className="text-xs text-default-500">
          {/* {loading ? "Streaming..." : ""} */}
        </div>
      </div>

      {/* 채팅 히스토리 영역 */}
      <div ref={scrollRef} className="flex-1 overflow-auto p-4">
        <div className="mx-auto max-w-3xl space-y-3">
          {messages.map((m, i) => {
            const cls =
              m.type === "user"
                ? "bg-content2"
                : m.type === "ai"
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
                  {roleLabel(m.type)}
                </div>
                {m.type === "ai" ? (
                  // LLM 응답에만 Markdown 적용
                  <div className="prose prose-sm max-w-none prose-pre:overflow-x-auto">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                    >
                      {m.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  // 사용자/시스템 메시지는 평문 유지
                  <div className="whitespace-pre-wrap text-sm">{m.type === "user" && m.content}</div>
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
                sendMessage(input, uuid);
              }
            }}
            // isDisabled={loading}
          />
          <Button color="primary" onPress={() => sendMessage(input, uuid)} >
            {/* {loading ? "Sending..." : "Send"} */}
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
