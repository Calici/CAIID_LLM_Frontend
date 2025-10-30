// components/RightPane.tsx
"use client";

import { useState, useEffect } from "react";
import QueryPanel from "@/components/QueryPanel";
import FilesPanel from "@/components/FilesPanel";
import type { QueryFields } from "@/types/query";
import { PublicationT } from "@/app/api/chatStream";

function PublicationItem(publication: PublicationT) {
  return (
    <div className="w-full border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="space-y-2">
        {/* Title */}
        {publication.link ? (
          <a
            href={publication.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg font-semibold text-blue-600 hover:underline block"
          >
            {publication.title}
          </a>
        ) : (
          <h3 className="text-lg font-semibold text-gray-900">
            {publication.title}
          </h3>
        )}

        {/* Authors */}
        <p className="text-sm text-gray-600">
          {publication.authors.join(", ")}
        </p>

        {/* Source */}
        <p className="text-sm italic text-gray-500">{publication.source}</p>

        {/* Abstract */}
        {publication.abstract && (
          <p className="text-sm text-gray-700 line-clamp-3">
            {publication.abstract}
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
      <div className="border-b h-2/3 overflow-auto">
        {publications.map((p) => (
          <PublicationItem {...p} />
        ))}
      </div>
      
        {/* FilesPanel은 기존 그대로 사용 */}
        <FilesPanel /* topicId={...} api={...}  */ />
      
    </div>
  );
}
