"use client";

import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faChevronRight,
  faGear,
  faEye,
  faEyeSlash,
} from "@fortawesome/free-solid-svg-icons";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";

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
]; // Random list for Project list showup

const LS_KEY_OPENAI = "openai_api_key"; // OpenAI API KEY

type SidebarProps = {
  collapsed?: boolean;
  onToggle?: () => void; // 부모의 leftOpen 토글
};

export default function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const [open, setOpen] = useState(false); // Modal open/close
  const [apiKey, setApiKey] = useState(""); // Input value
  const [error, setError] = useState(""); // Validation Message
  const [saved, setSaved] = useState(false); // show saved Feedback
  const [filter, setFilter] = useState("");
  const [topicsOpen, setTopicsOpen] = useState(true);
  const [showKey, setShowKey] = useState(false); // Bool For OpenAI Key Show or not

  const [toast, setToast] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const showToast = (type: "success" | "error", msg: string, ms = 1500) => {
    setToast({ type, msg });
    window.setTimeout(() => setToast(null), ms);
  };

  const errMsg = (e: unknown) =>
    e instanceof Error
      ? e.message
      : typeof e === "string"
        ? e
        : "Unknown error";

  useEffect(() => {
    // SSR 보호: window가 없을 수 있으니 가드
    if (typeof window === "undefined") return;
    const existing = localStorage.getItem(LS_KEY_OPENAI);
    if (existing) setApiKey(existing);
  }, []);

  const handleSave = () => {
    const k = apiKey.trim();

    // 1) 간단 검증
    if (!k) {
      setError("Please enter your OpenAI API key.");
      setSaved(false);
      return;
    }
    if (!k.startsWith("sk-")) {
      setError("The key should start with 'sk-'.");
      setSaved(false);
      return;
    }

    // 2) 저장
    try {
      localStorage.setItem(LS_KEY_OPENAI, k);
      setError("");
      setSaved(true);
      showToast("success", "Saved API Key Successfully..");
      window.setTimeout(() => {
        setSaved(false);
        setOpen(false);
      }, 400);
      // 3) 잠시 후 'Saved' 배지 숨기기 (선택)
      setTimeout(() => setSaved(false), 1500);
    } catch (e) {
      const msg = errMsg(e);
      setError(`Failed to save the key. Check your browser settings. : ${msg}`);
      setSaved(false);
      showToast("error", `failed to save : ${msg}`);
    }
  };

  const handleClear = () => {
    localStorage.removeItem(LS_KEY_OPENAI);
    setApiKey("");
    setError("");
    setSaved(false);
  };

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

      <div className="p-0 border-t">
        <Button
          variant="light"
          radius="none"
          className="w-full h-12 justify-start"
          onPress={() => {
            setOpen(true);
          }}
          aria-label="Open Settings"
        >
          <span className="flex items-center gap-2">
            <FontAwesomeIcon icon={faGear} size="lg" />
          </span>
          <span className="text-lg text-default-800">Settings</span>
        </Button>
      </div>

      {/* Settings Modal Here */}
      <Modal isOpen={open} onOpenChange={setOpen} placement="center">
        <ModalContent>
          {(
            onClose // ← Heroui의 render-prop 패턴
          ) => (
            <>
              <ModalHeader className="text-sm">Settings</ModalHeader>
              <ModalBody>
                <p className="text-sm">
                  This modal handles Settings for the system.
                </p>
                <Input
                  label="OpenAI API Key"
                  placeholder="sk-**************************"
                  variant="bordered"
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onValueChange={(val) => {
                    setApiKey(val);
                    if (error) setError("");
                  }}
                  isInvalid={!!error}
                  errorMessage={error || undefined}
                  isRequired
                  description="Your key stays on this device."
                  endContent={
                    <Button
                      isIconOnly
                      variant="light"
                      size="sm"
                      radius="full"
                      aria-label={showKey ? "Hide API key" : "Show API key"}
                      onPress={() => setShowKey((v) => !v)}
                      onMouseDown={(e) => e.preventDefault()} // prevents input losing focus when clicking Eye button
                      className="min-w-0"
                    >
                      <FontAwesomeIcon
                        icon={showKey ? faEyeSlash : faEye}
                        className="text-default-500"
                      />
                    </Button>
                  }
                />
                {saved && <p className="text-xs text-success">Saved ✓</p>}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" onPress={handleClear}>
                  Clear
                </Button>
                <Button color="default" onPress={onClose}>
                  Close
                </Button>
                <Button color="primary" onPress={handleSave}>
                  Save
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      {/* Toast (position: fixed) */}
      {toast && (
        <div className="pointer-events-none fixed top-4 right-4 z-50">
          <div
            className={[
              "rounded-md px-3 py-2 shadow-lg text-sm transition-opacity",
              toast.type === "success"
                ? "bg-success-100 text-success-800"
                : "bg-danger-100 text-danger-800",
            ].join(" ")}
          >
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  );
}
