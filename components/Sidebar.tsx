"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  createWorkspace,
  type WorkspaceSummary,
} from "@/app/api/wrappers";

const LS_KEY_OPENAI = "openai_api_key"; // OpenAI API KEY

type SidebarProps = {
  collapsed?: boolean;
  onToggle?: () => void; // parent toggles left pane, Not using now
};

export default function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  //──────────────────────────────────────────────────────────────────────────
  // UI state (settings & dialogs)
  //──────────────────────────────────────────────────────────────────────────
  const [settingsOpen, setSettingsOpen] = useState(false); // Modal open/close
  const [createOpen, setCreateOpen] = useState(false); // "new topic" modal

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
  const [draftName, setDraftName] = useState(""); // Input for newTopicModal

  // Theme
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false); // for dark mode toggle

  //──────────────────────────────────────────────────────────────────────────
  // Data state (workspaces) + async flags
  //──────────────────────────────────────────────────────────────────────────
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  //{ name: string; uuid: string }
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false); // checks if creating is in progress or not, prevents double creation
  const [loadErrorMsg, setLoadErrorMsg] = useState<string | null>(null);

  const filtered = useMemo(
    // Search topics feature
    () =>
      workspaces.filter((w) =>
        w.name.toLowerCase().includes(filter.toLowerCase())
      ),
    [workspaces, filter]
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

  // Fetch list
  const fetchWorkspaces = useCallback(async () => {
    setIsLoading(true);
    setLoadErrorMsg(null);
    try {
      const data = await listWorkspaces();
      setWorkspaces(data);
    } catch (e) {
      setLoadErrorMsg(getErrMsg(e));
    } finally {
      setIsLoading(false);
    }
  }, []);
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
  useEffect(() => {
    let alive = true;
    (async () => {
      await fetchWorkspaces();
    })();
    return () => {
      alive = false;
    };
  }, [fetchWorkspaces]);

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

  const handleCreateWorkspace = async (onClose: () => void) => {
    if (isCreating || isLoading) return;
    setIsCreating(true);
    setLoadErrorMsg(null);
    try {
      await createWorkspace({
        name: draftName.trim() || undefined,
        user_prompt: "Created from Sidebar",
      });
      await fetchWorkspaces(); // refresh list after creation
      onClose(); // close modal on success
      showToast("success", "Workspace created.");
    } catch (e) {
      setLoadErrorMsg(getErrMsg(e));
      showToast("error", getErrMsg(e));
    } finally {
      setIsCreating(false);
    }
  };

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
              setDraftName("");
              setCreateOpen(true);
            }}
            isDisabled={isCreating || isLoading} // 중복 클릭 방지용
          >
            {isCreating ? "Creating..." : "New topic"}
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
            <li key={w.uuid}>
              <Button
                variant="light"
                radius="sm"
                className="w-full justify-start"
              >
                {w.name}
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

      {/* New Topic Modal Here */}
      <Modal
        isOpen={createOpen}
        onOpenChange={setCreateOpen}
        placement="center"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="text-sm">New topic</ModalHeader>
              <ModalBody>
                <Input
                  label="Workspace name (optional)"
                  value={draftName}
                  onValueChange={setDraftName}
                  placeholder="e.g. Antiviral project"
                  isDisabled={isCreating}
                />
              </ModalBody>
              <ModalFooter>
                {/* 생성: 여기서만 API 호출 */}
                <Button
                  color="primary"
                  isDisabled={isCreating}
                  onPress={()=>handleCreateWorkspace(onClose)}
                >
                  {isCreating ? "Creating..." : "Create"}
                </Button>
                {/* 취소: 생성 호출 하지 않음 */}
                <Button
                  color="default"
                  onPress={() => {
                    onClose();
                  }}
                >
                  Cancel
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
