// components/RightPane.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import QueryPanel from "@/components/QueryPanel";
import FilesPanel from "@/components/FilesPanel";
import type { QueryFields } from "@/types/query";
import { PublicationT } from "@/app/api/chatStream";
import { Tabs, Tab } from "@heroui/tabs";

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
          <p
            className="text-sm text-muted-300 line-clamp-3"
            dangerouslySetInnerHTML={{ __html: publication.abstract }}
          ></p>
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
  const grouped = useMemo(() => {
    const map = new Map<string, PublicationT[]>();
    for (const p of publications) {
      const key = p.source?.trim() || "Unknown";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [publications]);

  const firstKey = grouped[0]?.[0] ?? "All";
  const [active, setActive] = useState<string>(firstKey);

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex flex-row items-center gap-3 p-3 border-b justify-between w-full">
        <p className="font-semibold">Publications</p>
      </div>

      {/* <div className="border-b h-2/3 overflow-auto">
        {publications.map((p,i) => (
          <PublicationItem key={i} {...p} />
        ))}
      </div> */}

      {/* 2) Tabs 영역 */}
      <div className="flex-1 border-b h-2/3 overflow-auto">
        {grouped.length === 0 ? (
          <div className="p-4 text-sm text-default-500">No publications</div>
        ) : (
          <Tabs
            selectedKey={active}
            onSelectionChange={(k) => setActive(k as string)}
            className="flex flex-col"
            // tab list는 자동, 내용 영역만 스크롤되도록
            classNames={{ panel: "flex-1 overflow-auto space-y-3 p-3" }}
          >
            {grouped.map(([source, items]) => (
              <Tab key={source} title={`${source} (${items.length})`}>
                {items.map((p, i) => (
                  <PublicationItem key={`${source}-${i}`} {...p} />
                ))}
              </Tab>
            ))}
          </Tabs>
        )}
      </div>

      {/* FilesPanel은 기존 그대로 사용 */}
      <FilesPanel /* topicId={...} api={...}  */ />
    </div>
  );
}
