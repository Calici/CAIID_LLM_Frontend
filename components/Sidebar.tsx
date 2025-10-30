"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Switch } from "@heroui/switch";
import { useTheme } from "next-themes";
import { Tabs, Tab } from "@heroui/tabs";
import { Select, SelectItem } from "@heroui/select";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faChevronRight,
  faGear,
  faEye,
  faEyeSlash,
  faPen,
  faTrash,
  faUser,
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
  getLlmServer,
  updateLlmServer,
  type LlmServerConfig,
  ServerConfig,
} from "@/app/api/wrappers";
import SafeButton from "./safebutton/safebutton";

type SidebarProps = {
  collapsed?: boolean;
  onToggle?: () => void; // parent toggles left pane, Not using now
  onSelectWorkspace: (uuid: string | null) => void; // ★ 추가
  workSpaces: WorkspaceSummary[];
  activeUuid: string | null;
  setWorkspaces: React.Dispatch<React.SetStateAction<WorkspaceSummary[]>>;
};

export default function Sidebar({
  collapsed = false,
  onToggle,
  onSelectWorkspace,
  workSpaces,
  activeUuid,
  setWorkspaces,
}: SidebarProps) {
  //──────────────────────────────────────────────────────────────────────────
  // UI state (settings & dialogs)
  //──────────────────────────────────────────────────────────────────────────
  const [settingsOpen, setSettingsOpen] = useState(false); // Modal open/close
  // const [createOpen, setCreateOpen] = useState(false); // "new topic" modal

  // Settings form state
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
        w.name.toLowerCase().includes(filter.toLowerCase()),
      ),
    [workSpaces, filter],
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
  //─────────────────────────────────────────────────────────────────────────

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

  //──────────────────────────────────────────────────────────────────────────
  // LLM Server Update settings
  //──────────────────────────────────────────────────────────────────────────

  const [server, setServer] = useState<LlmServerConfig | null>(null);

  //──────────────────────────────────────────────────────────────────────────
  // LLM Server Update settings Modal status
  //──────────────────────────────────────────────────────────────────────────
  type Mode = "lite" | "heavy";

  const [config, setConfig] = useState<
    ServerConfig & { api_key: string | null }
  >({
    username: null,
    name: null,
    model_name: null,
    api_url: null,
    api_key: null,
  });
  const [mode, __setMode] = useState<Mode>("heavy");
  const DEFAULT_OPENAI_URL = "https://api.openai.com/v1";

  const MODEL_OPTIONS = [
    { label: "GPT-5", value: "gpt-5" },
    { label: "GPT-5-mini", value: "gpt-5-mini" },
    { label: "GPT-5-pro", value: "gpt-5-pro" },
    { label: "GPT-5-nano", value: "gpt-5-nano" },
    { label: "gpt-4o-mini", value: "gpt-4o-mini" },
  ];
  // check if all empty
  const isEmptyConfig = (cfg?: Partial<LlmServerConfig> | null) =>
    !cfg || (!cfg.username && !cfg.name && !cfg.model_name && !cfg.api_url);

  // 프로그램 시작 시 서버 설정을 받아와 폼에 주입, 전부 null/빈값이면 모달 자동 오픈
  useEffect(() => {
    getLlmServer().then((config) => {
      setConfig({ ...config, api_key: null });
    });
  }, []);

  const setMode = React.useCallback((mode: Mode) => {
    if (mode === "lite") {
      setConfig((prevConfig) => ({
        ...prevConfig,
        api_url: DEFAULT_OPENAI_URL,
        api_key: null,
        model_name: "gpt-5-nano",
      }));
      __setMode("lite");
    } else {
      setConfig((prevConfig) => ({
        ...prevConfig,
        api_url: null,
        api_key: null,
      }));
      __setMode("heavy");
    }
  }, []);

  // Save Button Handler
  const handleServerSave = (onClose: () => void) => {
    // 서버 규격상 username, name은 기존 서버 응답에서 재사용
    let { name, username, model_name, api_url, api_key } = config;
    if (
      name === null ||
      username === null ||
      model_name === null ||
      api_url === null ||
      api_key === null
    ) {
      return Promise.resolve(null);
    }
    api_url = api_url.trim();
    username = username.trim();
    name = name.trim();
    if (api_url.length === 0 || username.length === 0) {
      return Promise.resolve(null);
    }
    return updateLlmServer({
      name,
      username,
      model_name,
      api_url,
      api_key,
    }).then(onClose);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Topics</h2>
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
                  <Button
                    size="sm"
                    color="primary"
                    isDisabled={!renameDraft.trim()}
                    onPress={async () => {
                      await renameWorkspace(w.uuid, {
                        name: renameDraft.trim(),
                      });
                      // 빠른 UX: 낙관적 반영
                      setWorkspaces((prev) =>
                        prev.map((x) =>
                          x.uuid === w.uuid
                            ? { ...x, name: renameDraft.trim() }
                            : x,
                        ),
                      );
                      setEditingId(null);
                      setRenameDraft("");
                      // 필요 시 재조회: await fetchworkSpaces();
                    }}
                  >
                    Save
                  </Button>
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
                <div className="flex items-center text-ellipsis">
                  <Button
                    variant={w.uuid === activeUuid ? "flat" : "light"}
                    color={w.uuid === activeUuid ? "primary" : "default"}
                    radius="sm"
                    className={`w-full justify-start${
                      w.uuid === activeUuid ? " font-semibold" : ""
                    }`}
                    onPress={() => onSelectWorkspace?.(w.uuid)}
                  >
                    {w.name.slice(0, 40)}
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
            onClose, // ← Heroui의 render-prop 패턴
          ) => (
            <>
              <ModalHeader className="text-sm">Settings</ModalHeader>
              <ModalBody>
                <Input
                  placeholder="John Doe"
                  type="text"
                  startContent={<FontAwesomeIcon icon={faUser} />}
                  value={config.username || undefined}
                  onValueChange={(v) =>
                    setConfig((prevConfig) => ({ ...prevConfig, username: v }))
                  }
                />
                {/* <div className="flex items-center justify-between">
                  <span className="text-sm">Lite mode</span>
                  <Switch
                    size="sm"
                    isSelected={liteMode}
                    onValueChange={setLiteMode}
                    aria-label="Toggle Lite mode"
                  />
                </div> */}
                <Tabs
                  selectedKey={mode}
                  fullWidth
                  onSelectionChange={(k) => {
                    if (k === "lite") setMode("lite");
                    else setMode("heavy");
                  }}
                >
                  <Tab key="lite" title="Lite" />
                  <Tab key="heavy" title="Heavy" />
                </Tabs>

                {/* 3-1. 모델명 (Lite ON일 때만 선택 가능) */}
                <div
                  className="mt-3 aria-hidden:hidden"
                  aria-hidden={mode === "heavy"}
                >
                  <Select
                    className="aria-hidden:hidden"
                    aria-hidden={mode === "heavy"}
                    selectedKeys={
                      config.model_name === null ? [] : [config.model_name]
                    }
                    onSelectionChange={(k) => {
                      const { currentKey } = k;
                      if (currentKey !== undefined && currentKey.length !== 0) {
                        setConfig((prevConfig) => ({
                          ...prevConfig,
                          model_name: currentKey,
                        }));
                      }
                    }}
                  >
                    {MODEL_OPTIONS.map((option) => (
                      <SelectItem key={option.value}>{option.label}</SelectItem>
                    ))}
                  </Select>
                </div>
                {/* 3-3. API URL */}
                <div className="">
                  <Input
                    label="API URL"
                    placeholder="https://llm.example.com/v1"
                    variant="bordered"
                    value={config.api_url || undefined}
                    onValueChange={(v) =>
                      setConfig((prevConfig) => ({ ...prevConfig, api_url: v }))
                    }
                  />
                </div>
                {/* 3-2. API key */}
                <div className="">
                  <Input
                    label="API Key"
                    placeholder="sk-**************************"
                    variant="bordered"
                    type="password"
                    value={config.api_key || undefined}
                    onValueChange={(v) =>
                      setConfig((prevConfig) => ({ ...prevConfig, api_key: v }))
                    }
                    isInvalid={config.api_key === null}
                    errorMessage={<p>Enter API Key (anything if no api key)</p>}
                  />
                </div>
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
                {/* <Button color="danger" onPress={handleClear}>
                  Clear
                </Button> */}
                <Button color="default" onPress={onClose}>
                  Close
                </Button>
                <SafeButton
                  color="primary"
                  onPress={() => handleServerSave(onClose)}
                >
                  Save
                </SafeButton>
                <Button
                  color="warning"
                  onPress={async () => {
                    try {
                      const serverInfo = await getLlmServer();
                      alert(JSON.stringify(serverInfo, null, 2)); // 보기 좋게 들여쓰기
                    } catch (e) {
                      alert("Error: " + (e as Error).message);
                    }
                  }}
                >
                  (Test) get Current LLM
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
                <Button
                  color="danger"
                  onPress={async () => {
                    if (!deletingId) return;
                    await deleteWorkspace(deletingId);
                    // 낙관적 제거
                    setWorkspaces((prev) =>
                      prev.filter((x) => x.uuid !== deletingId),
                    );
                    setDeletingId(null);
                    onSelectWorkspace(null);
                  }}
                >
                  Delete
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
