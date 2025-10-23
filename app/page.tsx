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
import { useState } from "react";
import MarkdownTest from "@/components/MarkdownTest";

export default function Page() {
  const [leftOpen, setLeftOpen] = useState(true); // 왼쪽 사이드바 열림/닫힘
  const [rightOpen, setRightOpen] = useState(true); // 오른쪽 파일 패널 열림/닫힘

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
          />
        </aside>

        {/* 가운데 채팅 패널 */}
        <section className="min-w-0">
          <ChatPanel />
        </section>

        {/* 오른쪽 파일 패널 (원하시면 동일한 방식으로 토글) */}
        <aside className="hidden border-l lg:block">
          <RightPane />
        </aside>
      </div>
    </main>
  );
}
