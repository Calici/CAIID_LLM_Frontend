"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Switch } from "@heroui/switch";
import { useTheme } from "next-themes";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faChevronRight,
  faGear,
  faEye,
  faEyeSlash,
  faPen,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import {
  listWorkspaces,
  renameWorkspace,
  deleteWorkspace,
  type WorkspaceSummary,
} from "@/app/api/wrappers";
import { postChatStream } from "@/app/api/chatStream";

const LS_KEY_OPENAI = "openai_api_key"; // OpenAI API KEY

type SidebarProps = {
  collapsed?: boolean;
  onToggle?: () => void; // parent toggles left pane, Not using now
  onSelectWorkspace: (uuid: string | null) => void; // ★ 추가
  workSpaces: WorkspaceSummary[]
};

export default function Sidebar({
  collapsed = false,
  onToggle,
  onSelectWorkspace,
  workSpaces
}: SidebarProps) {
  //──────────────────────────────────────────────────────────────────────────
  // UI state (settings & dialogs)
  //──────────────────────────────────────────────────────────────────────────
  const [settingsOpen, setSettingsOpen] = useState(false); // Modal open/close
  // const [createOpen, setCreateOpen] = useState(false); // "new topic" modal

  // Settings form state
  const [apiKey, setApiKey] = useState(""); // Input value
  const [showKey, setShowKey] = useState(false); // Bool For OpenAI Key Show or not
  const [errorMsg, setErrorMsg] = useState(""); // Validation Message
  const [saved, setSaved] = useState(false); // show saved Feedback

  // Search/filter state
  const [filter, setFilter] = useState(""); // filter topics from this state
  const [topicsOpen, setTopicsOpen] = useState(true); // flag for sidebar, not in use for now

  // toast (top right side)
  const [toast, setToast] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  // new topic modal input
  //const [draftName, setDraftName] = useState(""); // Input for newTopicModal

  // Theme
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false); // for dark mode toggle

  //──────────────────────────────────────────────────────────────────────────
  // Data state (workSpaces) + async flags
  //──────────────────────────────────────────────────────────────────────────
  // const [workSpaces, setworkSpaces] = useState<workSpacesummary[]>([]);
  //{ name: string; uuid: string }
  const [isLoading, setIsLoading] = useState(false);
  //const [isCreating, setIsCreating] = useState(false); // checks if creating is in progress or not, prevents double creation
  const [loadErrorMsg, setLoadErrorMsg] = useState<string | null>(null);

  const filtered = useMemo(
    // Search topics feature
    () =>
      workSpaces.filter((w) =>
        w.name.toLowerCase().includes(filter.toLowerCase())
      ),
    [workSpaces, filter]
  );

  //──────────────────────────────────────────────────────────────────────────
  // Helpers
  //──────────────────────────────────────────────────────────────────────────
  const showToast = (type: "success" | "error", msg: string, ms = 1500) => {
    setToast({ type, msg });
    window.setTimeout(() => setToast(null), ms);
  }; // use it when need to display any toast

  const getErrMsg = (e: unknown) =>
    e instanceof Error
      ? e.message
      : typeof e === "string"
        ? e
        : "Unknown error"; // Error message display

  // // Fetch list
  // const fetchworkSpaces = useCallback(async () => {
  //   setIsLoading(true);
  //   setLoadErrorMsg(null);
  //   try {
  //     const data = await listworkSpaces();
  //     setworkSpaces(data);
  //   } catch (e) {
  //     setLoadErrorMsg(getErrMsg(e));
  //   } finally {
  //     setIsLoading(false);
  //   }
  // }, []);
  //──────────────────────────────────────────────────────────────────────────
  // Effects
  //──────────────────────────────────────────────────────────────────────────

  useEffect(() => setIsMounted(true), []);
  useEffect(() => {
    // SSR 보호: window가 없을 수 있으니 가드
    if (typeof window === "undefined") return;
    const existing = localStorage.getItem(LS_KEY_OPENAI);
    if (existing) setApiKey(existing);
  }, []);

  // Mount: initial workspace list
  // useEffect(() => {
  //   let alive = true;
  //   (async () => {
  //     await f();
  //   })();
  //   return () => {
  //     alive = false;
  //   };
  // }, [fetchworkSpaces]);

  //──────────────────────────────────────────────────────────────────────────
  // Handlers
  //──────────────────────────────────────────────────────────────────────────
  const handleSave = () => {
    const k = apiKey.trim();

    // 1) 간단 검증
    if (!k) {
      setErrorMsg("Please enter your OpenAI API key.");
      setSaved(false);
      return;
    }
    if (!k.startsWith("sk-")) {
      setErrorMsg("The key should start with 'sk-'.");
      setSaved(false);
      return;
    }

    // 2) 저장
    try {
      localStorage.setItem(LS_KEY_OPENAI, k);
      setErrorMsg("");
      setSaved(true);
      showToast("success", "Saved API Key Successfully..");
      window.setTimeout(() => {
        setSaved(false);
        setSettingsOpen(false);
      }, 400);
      // 3) 잠시 후 'Saved' 배지 숨기기 (선택)
      setTimeout(() => setSaved(false), 1500);
    } catch (e) {
      const msg = getErrMsg(e);
      setErrorMsg(
        `Failed to save the key. Check your browser settings. : ${msg}`
      );
      setSaved(false);
      showToast("error", `failed to save : ${msg}`);
    }
  };

  const handleClear = () => {
    localStorage.removeItem(LS_KEY_OPENAI);
    setApiKey("");
    setErrorMsg("");
    setSaved(false);
  };

  // async function handleCreateByChat(onClose: () => void) {
  //   if (isCreating) return;
  //   setIsCreating(true);
  //   try {
  //     await postChatStream(
  //       { user_prompt: draftName.trim() || "New workspace" }, // uuid 없음 → 새로 생성
  //       {
  //         // 가볍게 끝만 받을 경우
  //         onEnd: async () => {
  //           // 서버에서 생성이 완료되면 목록을 다시 가져와 사이드바 갱신
  //           const data = await listworkSpaces();
  //           setworkSpaces(data);
  //           onClose();
  //           showToast("success", "Workspace created via chat.");
  //         },
  //         onError: (e) => {
  //           showToast("error", e instanceof Error ? e.message : String(e));
  //         },
  //       }
  //     );
  //   } finally {
  //     setIsCreating(false);
  //   }
  // }
  //──────────────────────────────────────────────────────────────────────────
  // Remove / Delete topics
  //──────────────────────────────────────────────────────────────────────────
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");

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
            onPress={() => {
              console.log(`clicked, `, onSelectWorkspace);
              setFilter("");
              onSelectWorkspace(null);
            }}
          >
            New topic
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-2">
        {isLoading && <p className="text-xs text-default-500">Loading…</p>}
        {!isLoading && loadErrorMsg && (
          <p className="text-xs text-danger-500">Failed: {loadErrorMsg}</p>
        )}
        {!isLoading && !loadErrorMsg && filtered.length === 0 && (
          <p className="text-xs text-default-400">No topics found</p>
        )}
        <ul className="space-y-1">
          {filtered.map((w) => (
            <li key={w.uuid} className="group">
              {/* normal row or inline-edit row */}
              {editingId === w.uuid ? (
                // 인라인 rename 편집행
                <div className="flex items-center gap-2">
                  <Input
                    size="sm"
                    value={renameDraft}
                    onValueChange={setRenameDraft}
                    className="flex-1"
                    autoFocus
                  />
                  {/* <Button
                    size="sm"
                    color="primary"
                    isDisabled={!renameDraft.trim()}
                    onPress={async () => {
                      await renameWorkspace(w.uuid, {
                        name: renameDraft.trim(),
                      });
                      // 빠른 UX: 낙관적 반영
                      setworkSpaces((prev) =>
                        prev.map((x) =>
                          x.uuid === w.uuid
                            ? { ...x, name: renameDraft.trim() }
                            : x
                        )
                      );
                      setEditingId(null);
                      setRenameDraft("");
                      // 필요 시 재조회: await fetchworkSpaces();
                    }}
                  >
                    Save
                  </Button> */}
                  <Button
                    size="sm"
                    variant="light"
                    onPress={() => {
                      setEditingId(null);
                      setRenameDraft("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                // 일반 행 (hover actions)
                <div className="flex items-center">
                  <Button
                    variant="light"
                    radius="sm"
                    className="w-full justify-start"
                    onPress={() => onSelectWorkspace?.(w.uuid)}
                  >
                    {w.name}
                  </Button>
                  <div className="ml-2 hidden items-center gap-1 group-hover:flex">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      aria-label="Rename"
                      onPress={() => {
                        setEditingId(w.uuid);
                        setRenameDraft(w.name);
                      }}
                    >
                      <FontAwesomeIcon icon={faPen} />
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      aria-label="Delete"
                      onPress={() => {
                        setDeletingId(w.uuid);
                      }}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </Button>
                  </div>
                </div>
              )}
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
            setSettingsOpen(true);
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
      <Modal
        isOpen={settingsOpen}
        onOpenChange={setSettingsOpen}
        placement="center"
      >
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
                    if (errorMsg) setErrorMsg("");
                  }}
                  isInvalid={!!errorMsg}
                  errorMessage={errorMsg || undefined}
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
                {isMounted && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Dark mode</span>
                    <Switch
                      size="sm"
                      isSelected={(resolvedTheme ?? theme) === "dark"}
                      onValueChange={(on) => setTheme(on ? "dark" : "light")}
                      aria-label="Toggle dark mode"
                    />
                  </div>
                )}
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

      {/* Delete  Modal Here */}
      <Modal isOpen={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="text-sm">Delete workspace</ModalHeader>
              <ModalBody>
                <p className="text-sm">
                  This action cannot be undone. Continue?
                </p>
              </ModalBody>
              <ModalFooter>
                <Button color="default" onPress={onClose}>
                  Cancel
                </Button>
                {/* <Button
                  color="danger"
                  onPress={async () => {
                    if (!deletingId) return;
                    await deleteWorkspace(deletingId);
                    // 낙관적 제거
                    setworkSpaces((prev) =>
                      prev.filter((x) => x.uuid !== deletingId)
                    );
                    setDeletingId(null);
                    await fetchworkSpaces();
                  }}
                >
                  Delete
                </Button> */}
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
