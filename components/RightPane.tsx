// components/RightPane.tsx
"use client";

import { useState, useEffect } from "react";
import QueryPanel from "@/components/QueryPanel";
import FilesPanel from "@/components/FilesPanel";
import type { QueryFields } from "@/types/query";

/** 우측 패널: 위 Query, 아래 Files */
export default function RightPane() {
  const [q, setQ] = useState<QueryFields>({
    title: "",
    author: "",
    pdfUrl: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);

  // (선택) 백엔드가 “검색 결과 → 질의 필드 채워넣기”를 주입하는 자리를 가정
  // useEffect(() => { setQ(filledFromBackend); }, [filledFromBackend]);

  const applyNext = async () => {
    // 이 자리에서:
    // 1) q 값을 서버에 전달해 deterministic search를 유도하거나
    // 2) 다음 /api/chat 호출 시 system prompt/context에 포함 (프론트 컷오프 빌더에 주입)
    setLoading(true);
    try {
      // await fetch("/api/query/apply", { method: "POST", body: JSON.stringify(q) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full grid grid-rows"> 
      {/* ↑ 위쪽 고정 높이(예: 260px). 필요 시 조정/리사이저 추가 가능 */}
      <div className="border-b min-h-0">
        <QueryPanel value={q} onChange={setQ} onSubmit={applyNext} isLoading={loading} />
      </div>
      <div className="min-h-0">
        {/* FilesPanel은 기존 그대로 사용 */}
        <FilesPanel /* topicId={...} api={...}  */ />
      </div>
    </div>
  );
}
