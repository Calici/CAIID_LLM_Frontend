"use client";

import { useState, useEffect } from "react";
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
  // ────────────────────────────────────────────────────────────────────────────
  // UI state (settings & dialogs)
  //────────────────────────────────────────────────────────────────────────────
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
  const [workspaces, setWorkspaces] = useState<
    { name: string; uuid: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false); // checks if creating is in progress or not, prevents double creation
  const [newOpen, setNewOpen] = useState(false); // newTopicModal open toggle
  const [newName, setNewName] = useState(""); // Input for newTopicModal
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false); // for dark mode toggle

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    let alive = true;
    setLoading(true); // start loading
    setLoadError(null); // reset former error
    listWorkspaces() // # API CALL
      .then((data) => {
        if (alive) setWorkspaces(data);
      })
      .catch((e) => {
        if (alive) setLoadError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []); //empty array means it will execute only on first render

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

  const filtered = workspaces.filter((w) =>
    w.name.toLowerCase().includes(filter.toLowerCase())
  );

  const onClickNew = async () => {
    // New topic 클릭 시 createWorkSpace API invoke
    // 0) 이미 로딩 중이면 중복 방지
    if (creating || loading) return;

    setCreating(true);
    setLoadError(null);
    try {
      // 1) 워크스페이스 이름 입력(임시 간단 UX) — 원치 않으면 생략 가능
      const name = window.prompt("New workspace name? (optional)") || undefined;

      // 2) create 호출 (user_prompt는 서버가 필요로 하는 필수 필드)
      await createWorkspace({
        name,
        user_prompt: "Created from Sidebar", // TODO: 프로젝트에 맞게 텍스트 수정
      });

      // 3) 목록 리프레시
      const data = await listWorkspaces();
      setWorkspaces(data);

      // 4) 성공 토스트(선택)
      showToast("success", "Workspace created");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setLoadError(msg);
      showToast("error", msg);
    } finally {
      setCreating(false);
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
              setNewName("");
              setNewOpen(true);
            }}
            isDisabled={creating || loading} // 중복 클릭 방지용
          >
            {creating ? "Creating..." : "New topic"}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-2">
        {loading && <p className="text-xs text-default-500">Loading…</p>}
        {!loading && loadError && (
          <p className="text-xs text-danger-500">Failed: {loadError}</p>
        )}
        {!loading && !loadError && filtered.length === 0 && (
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
                {mounted && (
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
      <Modal isOpen={newOpen} onOpenChange={setNewOpen} placement="center">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="text-sm">New topic</ModalHeader>
              <ModalBody>
                <Input
                  label="Workspace name (optional)"
                  value={newName}
                  onValueChange={setNewName}
                  placeholder="e.g. Antiviral project"
                  isDisabled={creating}
                />
              </ModalBody>
              <ModalFooter>
                {/* 생성: 여기서만 API 호출 */}
                <Button
                  color="primary"
                  isDisabled={creating}
                  onPress={async () => {
                    if (creating) return;
                    setCreating(true);
                    setLoadError(null);
                    try {
                      await createWorkspace({
                        name: newName.trim() || undefined,
                        user_prompt: "Created from Sidebar",
                      });
                      const data = await listWorkspaces();
                      setWorkspaces(data);
                      // on success: 닫기
                      onClose();
                      // 선택: 토스트
                      // showToast("success", "Workspace created");
                    } catch (e) {
                      const msg = e instanceof Error ? e.message : String(e);
                      setLoadError(msg);
                      // showToast("error", msg);
                    } finally {
                      setCreating(false);
                    }
                  }}
                >
                  {creating ? "Creating..." : "Create"}
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
