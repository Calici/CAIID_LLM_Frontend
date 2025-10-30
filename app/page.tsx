"use client";

import { Link } from "@heroui/link";
import { Snippet } from "@heroui/snippet";
import { Code } from "@heroui/code";
import { button as buttonStyles } from "@heroui/theme";

import { siteConfig } from "@/config/site";
import { title, subtitle } from "@/components/primitives";
import { GithubIcon } from "@/components/icons";

import Sidebar from "@/components/Sidebar";
import ChatPanel from "@/components/ChatPanel";
import RightPane from "@/components/RightPane";
import FilesPanel from "@/components/FilesPanel";
import { useEffect, useState } from "react";
import React from "react";
import MarkdownTest from "@/components/MarkdownTest";
import { getWorkspace, listWorkspaces, Workspace } from "./api/wrappers";
import { postChatStream } from "./api/chatStream";

function useWorkspace(
  uuid: string | null,
  appendUuid: (name: string, uuid: string) => void
) {
  const [workSpace, setWorkSpace] = useState<Workspace | null>(null);
  useEffect(() => {
    if (uuid === null) {
      setWorkSpace(null);
      return;
    }
    getWorkspace(uuid).then((workSpace) => setWorkSpace(workSpace));
  }, [uuid]);
  const sendMessage = React.useCallback(
    (msg: string) => {
      postChatStream(
        { user_prompt: msg, uuid: uuid === null ? undefined : uuid },
        {
          onChat: (v) => {
            setWorkSpace((prevWorkspace) => {
              if (prevWorkspace === null) return null;
              const messages = prevWorkspace.chat_history.messages.slice();
              const lastMessage = prevWorkspace.chat_history.messages.slice(-1)[0];
              if (lastMessage.type === "ai" && v.type === "ai") {
                messages.splice(messages.length - 1, 1)
                messages.push({type: "ai", content: lastMessage.content + v.content})
              } else if (
                v.type === "tool_call" &&
                lastMessage.type === "tool_call" &&
                v.tool_call_id === lastMessage.tool_call_id
              ) {
                messages.splice(messages.length - 1, 1)
                messages.push({
                  ...lastMessage, is_complete: v.is_complete
                })
              } else {
                messages.push(v);
              }
              return {
                ...prevWorkspace,
                chat_history: {
                  ...prevWorkspace.chat_history,
                  messages,
                },
              };
            });
          },
          onRecord: (name, uuid) => {
            appendUuid(name, uuid);
          },
          onQuery: (v) => {
            setWorkSpace((prevWorkspace) => {
              if (prevWorkspace === null) return null;
              return {
                ...prevWorkspace,
                chat_history: {
                  ...prevWorkspace.chat_history,
                  queries: v,
                },
              };
            });
          },
        }
      );
    },
    [uuid]
  );
  return { workSpace, sendMessage}
}

export default function Page() {
  const [leftOpen, setLeftOpen] = useState(true); // 왼쪽 사이드바 열림/닫힘
  const [rightOpen, setRightOpen] = useState(true); // 오른쪽 파일 패널 열림/닫힘

  // ★ 현재 선택된 워크스페이스
  const [selectedWs, setSelectedWs] = useState<string | null>(null);
  
  const [workSpaces, setWorkspaces] = useState<{ name: string, uuid: string }[]> ([])

  const [activeUuid, setActiveUuid] = useState<string | null>(null)
  const appendUuid = React.useCallback((name: string, uuid: string) => {
    setWorkspaces((prevWorkspaces) => [{ name, uuid}, ...prevWorkspaces])
    setActiveUuid(uuid)
  }, [ ])
  const { 
    workSpace, sendMessage
  } = useWorkspace(activeUuid, appendUuid)

  useEffect(()=> {
    listWorkspaces().then((v)=>{
      setWorkspaces(v)
    })
  }, [])


  const gridCols =
    leftOpen && rightOpen
      ? "lg:grid-cols-[260px_1fr_320px]"
      : leftOpen && !rightOpen
        ? "lg:grid-cols-[260px_1fr_0px]"
        : !leftOpen && rightOpen
          ? "lg:grid-cols-[0px_1fr_320px]"
          : "lg:grid-cols-[0px_1fr_0px]";

  return (
    <main className="h-[100dvh] w-full overflow-hidden">
      {/* 3-열 레이아웃: 좌 260px, 중간 1fr, 우 320px (토글 시 0px로 축소) */}
      <div
        className={`grid h-full grid-rows-[auto_1fr] lg:grid-rows-1 ${gridCols}`}
      >
        {/* 모바일 상단 바 */}
        <header className="flex items-center gap-2 px-4 py-3 border-b lg:hidden">
          <h1 className="text-base font-semibold">Chat Workspace</h1>
        </header>

        {/* 왼쪽 사이드바 */}
        <aside
          className={`hidden border-r lg:block transition-[opacity] duration-200 ${
            leftOpen ? "" : "opacity-0 pointer-events-none"
          }`}
          aria-hidden={!leftOpen}
        >
          {/* Sidebar에 collapsed/onToggle 전달 */}
          <Sidebar
            collapsed={!leftOpen}
            onToggle={() => setLeftOpen((v) => !v)}
            workSpaces = {workSpaces}
            // ★ 사이드바에서 토픽 선택/새토픽 준비 시 호출
            onSelectWorkspace={setActiveUuid}
          />
        </aside>

        {/* 가운데 채팅 패널 */}
        <section className="min-w-0">
          <ChatPanel
            // workspaceUuid={selectedWs}
            // onWorkspaceCreated={(newUuid) => setSelectedWs(newUuid)} // 최초 생성 후 선택
            messages = {workSpace=== null ? []: workSpace.chat_history.messages}
            sendMessage = {sendMessage}
          />
        </section>

        {/* 오른쪽 파일 패널 (원하시면 동일한 방식으로 토글) */}
        <aside className="hidden border-l lg:block min-h-0">
          <RightPane publications={workSpace === null ? []: workSpace.chat_history.queries} />
        </aside>
      </div>
    </main>
  );
}
