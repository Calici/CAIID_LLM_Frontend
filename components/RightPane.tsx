// components/RightPane.tsx
"use client";

import { useState, useEffect } from "react";
import QueryPanel from "@/components/QueryPanel";
import FilesPanel from "@/components/FilesPanel";
import type { QueryFields } from "@/types/query";
import { PublicationT } from "@/app/api/chatStream";

function PublicationItem(publication: PublicationT) {
  return (
    <div className="w-full border border-surface-strong bg-surface-muted rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="space-y-2">
        {/* Title */}
        {publication.link ? (
          <a
            href={publication.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg font-semibold text-primary-400 hover:underline block"
          >
            {publication.title}
          </a>
        ) : (
          <h3 className="text-lg font-semibold text-muted-200">
            {publication.title}
          </h3>
        )}

        {/* Authors */}
        <p className="text-sm text-muted-400">
          {publication.authors.join(", ")}
        </p>

        {/* Source */}
        <p className="text-sm italic text-muted-500">{publication.source}</p>

        {/* Abstract */}
        {publication.abstract && (
          <p className="text-sm text-muted-300 line-clamp-3" dangerouslySetInnerHTML={{__html: publication.abstract}}>
          </p>
        )}
      </div>
    </div>
  );
}
/** 우측 패널: 위 Query, 아래 File s */
export type RightPaneT = {
  publications: PublicationT[];
};
export default function RightPane({ publications }: RightPaneT) {
  return (
    <div className="h-full flex flex-col min-h-0">
      {/* ↑ 위쪽 고정 높이(예: 260px). 필요 시 조정/리사이저 추가 가능 */}
      <div className="flex flex-row items-center gap-3 p-3 border-b border-surface-strong justify-between w-full">
        <p className="font-semibold">Publications</p>
      </div>
      <div className="border-b border-surface-strong h-2/3 overflow-auto">
        {publications.map((p,i) => (
          <PublicationItem key={i} {...p} />
        ))}
      </div>
      
        {/* FilesPanel은 기존 그대로 사용 */}
        <FilesPanel /* topicId={...} api={...}  */ />
      
    </div>
  );
}
