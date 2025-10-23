// components/QueryPanel.tsx
"use client";

import { useEffect } from "react";
import { Input, Textarea } from "@heroui/input";
import { Button } from "@heroui/button";
import type { QueryFields } from "@/types/query";

type Props = {
  value: QueryFields;                      // controlled 값
  onChange: (next: QueryFields) => void;   // 필드 변경 통지
  onSubmit?: () => void;                   // “이 값으로 검색/다음 쿼리 반영”
  isLoading?: boolean;                     // 검색중 비활성화
};

export default function QueryPanel({ value, onChange, onSubmit, isLoading }: Props) {
  // (선택) 처음 포커스
  useEffect(() => {
    // …
  }, []);

  const set = (patch: Partial<QueryFields>) => onChange({ ...value, ...patch });

  return (
    <div className="h-full overflow-auto p-3">
      <div className="grid grid-cols-1 gap-3">
        <Input
          label="Title"
          size="sm"
          value={value.title}
          onValueChange={(v) => set({ title: v })}
          variant="bordered"
        />
        <Input
          label="Author"
          size="sm"
          value={value.author}
          onValueChange={(v) => set({ author: v })}
          variant="bordered"
        />
        <Input
          label="PDF URL"
          size="sm"
          value={value.pdfUrl}
          onValueChange={(v) => set({ pdfUrl: v })}
          variant="bordered"
          placeholder="https://..."
        />
        <Textarea
          label="Description"
          minRows={3}
          maxRows={6}
          value={value.description}
          onValueChange={(v) => set({ description: v })}
          variant="bordered"
        />
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="flat"
            onPress={onSubmit}
            isDisabled={isLoading}
            color="primary"
          >
            Apply to next query
          </Button>
        </div>
      </div>
    </div>
  );
}
