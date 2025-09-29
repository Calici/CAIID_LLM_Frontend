"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

const MOCK_TOPICS = [
  "Lorum ipsum dolor",
  "Consectetur adipiscing",
  "Sed do eiusmod",
  "Tempor incididunt",
  "Ut labore dolore",
  "Magna aliqua",
  "Ut enim ad minim",
  "Quis nostrud exercitation",
  "Ullamco laboris nisi",
  "Ut aliquip ex ea",
];

type SidebarProps = {
  collapsed?: boolean;
  onToggle?: () => void; // 부모의 leftOpen 토글
};

export default function Sidebar({collapsed = false, onToggle }: SidebarProps) {
  const [filter, setFilter] = useState("");
  const [topicsOpen, setTopicsOpen] = useState(true);
  const filtered = MOCK_TOPICS.filter((t) =>
    t.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="flex h-full flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Topics</h2>
          <Button
            isIconOnly
            variant="light"
            aria-label={topicsOpen ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={topicsOpen}
            aria-controls="topics-content"
            onPress={onToggle}
            className="p-1 rounded hover:bg-default-100"
          >
            <FontAwesomeIcon icon={faChevronRight} className="w-2 h-2" />
          </Button>
        </div>
        <div className="mt-3">
          <Input
            size="sm"
            placeholder="Search topics"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <div className="mt-3">
          <Button
            size="sm"
            color="primary"
            radius="sm"
            className="w-full"
            variant="flat"
          >
            New topic
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-2">
        <ul className="space-y-1">
          {filtered.map((t, i) => (
            <li key={i}>
              <Button
                variant="light"
                radius="sm"
                className="w-full justify-start"
              >
                {t}
              </Button>
            </li>
          ))}
        </ul>
      </div>

      <div className="p-3 border-t">
        <p className="text-xs text-default-500">
          Tip Add or select a topic to group your chats
        </p>
      </div>
    </div>
  );
}
