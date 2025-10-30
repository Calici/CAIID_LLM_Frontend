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
import ChatCard from './ChatCard'

type ChatPanelProps = {
  // workspaceUuid: string | null; // null이면 새로 만들 모드
  // onWorkspaceCreated?: (uuid: string) => void;
  messages: MessageT[]
  sendMessage: (msg: string) => void
  isGenerating: boolean
};

export default function ChatPanel({
  // workspaceUuid,
  // onWorkspaceCreated,
  messages, 
  sendMessage,
  isGenerating
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
      <div ref={scrollRef} className="h-full overflow-auto p-4">
        <div className="mx-auto max-w-3xl space-y-3">
          {
            messages.map((m, id) => ({
              m, showAvatar: id === 0 || m.type === 'user' || (
                messages[id -1 ].type === 'user' && (m.type === 'ai' || m.type === 'tool_call')
              ) , isLoading: false
            })).map((p, id) => <ChatCard key = {id} {...p} />)
          }
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
                sendMessage(input);
                setInput("");
              }
            }}
            // isDisabled={loading}
          />
          <Button color="primary" onPress={() => {sendMessage(input); setInput("")}} isLoading={isGenerating} >
            {/* {loading ? "Sending..." : "Send"} */}
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
