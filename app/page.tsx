"use client";

import Sidebar from "@/components/Sidebar";
import ChatPanel from "@/components/ChatPanel";
import RightPane from "@/components/RightPane";
import ConfigEditor from "@/components/ConfigEditor";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  deleteWorkspace,
  getLlmServer,
  getWorkspace,
  listWorkspaces,
  renameWorkspace,
  ServerConfig,
  updateLlmServer,
  Workspace,
  HistoryT,
  StateT,
  ServerPayload,
} from "./api/wrappers";
import { postChatStream } from "./api/chatStream";

type WorkspaceMeta = Omit<Workspace, "chat_history">;

// 오버레이 유형
type NoticeKind = "missing" | "config_error" | "server_error" | null;
type Notice = { kind: NoticeKind; message: string } | null;

function useWorkspace(
  uuid: string | null,
  appendUuid: (name: string, uuid: string) => void,
  handleHttpError: (err: any) => void
) {
  const [workspace, setWorkspace] = useState<WorkspaceMeta | null>(null);
  const [messages, setMessages] = useState<HistoryT>([]);
  const [queries, setQueries] = useState<StateT["queries"]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [missing, setMissing] = useState(false); // When UUID is missing, call new topic in 3 seconds.

  useEffect(() => {
    if (uuid === null) {
      setMissing(false);
      setWorkspace(null);
      setMessages([]);
      setQueries([]);
      return;
    }
    getWorkspace(uuid)
      .then((workspaceResponse) => {
        const { chat_history, ...meta } = workspaceResponse;
        setWorkspace(meta);
        setMessages(chat_history.messages);
        setQueries(chat_history.queries);
        setMissing(false);
      })
      .catch((e) => {
        // in case
        const status = e?.response?.status ?? e?.status;
        if (status === 404 || status === 410) {
          setWorkspace(null);
          setMessages([]);
          setQueries([]);
          handleHttpError(e); // ← 여기서 공통 처리 호출
        } else {
          // 412/500은 실제로 드묾. 그래도 혹시를 대비해 공통 처리 호출해도 OK
          handleHttpError(e);
        }
      });
  }, [uuid]);
  const sendMessage = useCallback(
    (msg: string) => {
      setMessages((prevMessages) => {
        const nextMessages = prevMessages.slice();
        const lastMessage = prevMessages[prevMessages.length - 1];
        if (lastMessage?.type === "user") {
          nextMessages.splice(nextMessages.length - 1, 1);
        }
        nextMessages.push({ type: "user", content: msg });
        return nextMessages;
      });
      setIsGenerating(true);
      postChatStream(
        { user_prompt: msg, uuid: uuid === null ? undefined : uuid },
        {
          onEnd: () => setIsGenerating(false),
          onChat: (v) => {
            setMessages((prevMessages) => {
              const nextMessages = prevMessages.slice();
              const lastMessage = prevMessages.slice(-1)[0];
              if (lastMessage?.type === "ai" && v.type === "ai") {
                nextMessages.splice(nextMessages.length - 1, 1);
                nextMessages.push({
                  type: "ai",
                  content: lastMessage.content + v.content,
                });
              } else if (
                v.type === "tool_call" &&
                lastMessage?.type === "tool_call" &&
                v.tool_call_id === lastMessage.tool_call_id
              ) {
                nextMessages.splice(nextMessages.length - 1, 1);
                nextMessages.push({
                  ...lastMessage,
                  is_complete: v.is_complete,
                });
              } else {
                nextMessages.push(v);
              }
              return nextMessages;
            });
          },
          onRecord: (name, uuid) => {
            appendUuid(name, uuid);
          },
          onQuery: (v) => {
            setQueries(v);
          },
          onError: (status) => handleHttpError({status}),
        }
      );
    },
    [uuid, appendUuid]
  );
  const setWorkspaceName = useCallback((name: string) => {
    setWorkspace((prev) => (prev === null ? prev : { ...prev, name }));
  }, []);
  return {
    workspace,
    messages,
    queries,
    sendMessage,
    isGenerating,
    setWorkspaceName,
    missing,
  };
}

export default function Page() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [workSpaces, setWorkspaces] = useState<
    { name: string; uuid: string }[]
  >([]);
  const [serverConfig, setServerConfig] = useState<ServerConfig | null>(null);

  const activeUuid = searchParams.get("uuid");
  const configParam = searchParams.get("config");
  const isConfigOpen = configParam === "open";

  const [countdown, setCountdown] = useState<number | null>(null); // Countdown Timer for missing pages before return to new page

  // 오버레이 상태: 종류 + 메시지
  const [notice, setNotice] = useState<Notice>(null);

  // 공통 에러 핸들러 타입(선택)
  type HttpErrorLike = { response?: { status?: number }; status?: number };

  // 상태코드 → notice 매핑 (Page 내부에 선언)
  const handleHttpError = useCallback((err: HttpErrorLike) => {
    const status = err?.response?.status ?? err?.status;
    if (status === 404 || status === 410) {
      setNotice({ kind: "missing", message: "Topic이 존재하지 않습니다." });
    } else if (status === 412) {
      setNotice({
        kind: "config_error",
        message: "API key나 API URL에 오류가 있습니다.",
      });
    } else if (status === 500) {
      setNotice({ kind: "server_error", message: "서버 에러가 발생했습니다." });
    } else {
      // 필요 시 기타 에러 토스트/로그 처리
      console.log("Unhandled error", status, err);
    }
  }, []);

  const setConfigOpen = useCallback(
    (open: boolean) => {
      const params = new URLSearchParams(searchParams.toString());
      if (open) {
        params.set("config", "open");
      } else {
        params.set("config", "closed");
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams]
  );

  const setActiveUuid = useCallback(
    (uuid: string | null) => {
      const activeUuid = searchParams.get("uuid");
      if (activeUuid === uuid) {
        return;
      }

      const params = new URLSearchParams(searchParams.toString());
      if (uuid !== null) {
        params.set("uuid", uuid);
      } else {
        params.delete("uuid");
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams]
  );

  const appendUuid = useCallback(
    (name: string, uuid: string) => {
      setWorkspaces((prevWorkspaces) => [{ name, uuid }, ...prevWorkspaces]);
      setActiveUuid(uuid);
    },
    [setActiveUuid, setWorkspaces]
  );
  const {
    workspace,
    messages,
    queries,
    sendMessage,
    isGenerating,
    setWorkspaceName,
  } = useWorkspace(activeUuid, appendUuid, handleHttpError);

  const renameWorkspaceByUuid = useCallback(
    (uuid: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return Promise.resolve(null);
      return renameWorkspace(uuid, { name: trimmed }).then(() => {
        setWorkspaces((prev) =>
          prev.map((workspaceItem) =>
            workspaceItem.uuid === uuid
              ? {
                  ...workspaceItem,
                  name: trimmed,
                }
              : workspaceItem
          )
        );
        if (uuid === activeUuid) {
          setWorkspaceName(trimmed);
        }
        return null;
      });
    },
    [activeUuid, setWorkspaceName, setWorkspaces]
  );

  const deleteWorkspaceByUuid = useCallback(
    (uuid: string) =>
      deleteWorkspace(uuid).then(() => {
        setWorkspaces((prev) =>
          prev.filter((workspaceItem) => workspaceItem.uuid !== uuid)
        );
        if (uuid === activeUuid) {
          setActiveUuid(null);
        }
        return null;
      }),
    [activeUuid, setActiveUuid, setWorkspaces]
  );

  useEffect(() => {
    listWorkspaces().then((v) => {
      setWorkspaces(v);
    });
  }, []);

  useEffect(() => {
    getLlmServer().then((config) => {
      setServerConfig(config);
      const haveNull = Object.values(config).reduce(
        (prev, cur) => prev || cur === null,
        false
      );
      if (haveNull) {
        setConfigOpen(true);
      }
    });
  }, []);

  // Countdown Timer hook when missing UUID
  useEffect(() => {
    if (!notice) {
      setCountdown(null);
      return;
    }
    setCountdown(3);
  }, [notice]);

  // 1sec timer
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      // 카운트다운 종료 시 후속 동작
      if (notice?.kind === "missing") {
        setActiveUuid(null); // 새 토픽(기존 동작)
      } else if (notice?.kind === "config_error") {
        setConfigOpen(true); // 설정 창 강제 오픈
        setNotice(null); // 오버레이 닫기
      } else if (notice?.kind === "server_error") {
        setNotice(null); // 안내만 하고 닫기
        // (선택) 자동 재시도 또는 토스트 권장
        // location.reload(); ← 이런거는 보통 사용자가 원치 않을 수 있어 권장 X
      }
      return;
    }
    const id = setTimeout(() => setCountdown((c) => (c ?? 0) - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown, notice, setActiveUuid, setConfigOpen]);

  const renameActiveWorkspace = useCallback(
    (name: string) => {
      if (!activeUuid) return Promise.resolve(null);
      return renameWorkspaceByUuid(activeUuid, name);
    },
    [activeUuid, renameWorkspaceByUuid]
  );

  const deleteActiveWorkspace = useCallback(() => {
    if (!activeUuid) return Promise.resolve(null);
    return deleteWorkspaceByUuid(activeUuid);
  }, [activeUuid, deleteWorkspaceByUuid]);

  const toggleConfigPanel = useCallback(() => {
    setConfigOpen(true);
  }, [setConfigOpen]);

  const handleConfigClose = useCallback(() => {
    setConfigOpen(false);
  }, [setConfigOpen]);

  const currentServerConfig = useMemo<ServerConfig>(
    () => ({
      username: serverConfig?.username ?? null,
      name: serverConfig?.name ?? null,
      model_name: serverConfig?.model_name ?? null,
      api_url: serverConfig?.api_url ?? null,
      api_key: null,
    }),
    [serverConfig]
  );

  const handleConfigSave = useCallback(
    (config: ServerPayload) => {
      return updateLlmServer(config);
    },
    [setServerConfig]
  );

  return (
    <>
      <main className="h-screen w-full">
        {/* 3-열 레이아웃: 좌 260px, 중간 1fr, 우 320px (토글 시 0px로 축소) */}
        <div className="flex flex-row h-full">
          {/* 모바일 상단 바 */}
          <header className="flex items-center gap-2 px-4 py-3 border-b border-surface-strong lg:hidden">
            <h1 className="text-base font-semibold">Chat Workspace</h1>
          </header>

          {/* 왼쪽 사이드바 */}
          <aside className="hidden min-w-[350px] border-r border-surface-strong lg:block">
            <Sidebar
              workSpaces={workSpaces}
              activeUuid={activeUuid}
              // ★ 사이드바에서 토픽 선택/새토픽 준비 시 호출
              onSelectWorkspace={setActiveUuid}
              onRenameWorkspace={renameWorkspaceByUuid}
              onDeleteWorkspace={deleteWorkspaceByUuid}
              onOpenConfig={toggleConfigPanel}
            />
          </aside>

          {/* 가운데 채팅 패널 */}
          <section className="min-w-0 h-full flex-1">
            <ChatPanel
              messages={messages}
              sendMessage={sendMessage}
              isGenerating={isGenerating}
              workspaceName={workspace?.name ?? ""}
              canEditWorkspace={Boolean(activeUuid)}
              onRenameWorkspace={renameActiveWorkspace}
              onDeleteWorkspace={deleteActiveWorkspace}
              showGreeting={activeUuid === null}
              uuid={activeUuid}
              username={serverConfig?.username ?? null}
            />
          </section>

          {/* 오른쪽 파일 패널 (원하시면 동일한 방식으로 토글) */}
          <aside className="hidden border-l border-surface-strong lg:block h-full w-[500px]">
            <RightPane publications={queries} />
          </aside>
          {notice && countdown !== null && (
            <div
              className="fixed top-2 left-1/2 -translate-x-1/2 z-50
                  bg-warning-100 text-warning-800 border border-warning-300
                  rounded-md px-3 py-2 shadow"
            >
              {/* 본문 메시지 */}
              <div className="font-medium">{notice.message}</div>

              {/* 후속 안내 문구*/}
              <div className="text-sm opacity-80 mt-0.5">
                {notice.kind === "missing" && (
                  <> {countdown}초 후 새 토픽을 생성합니다…</>
                )}
                {notice.kind === "config_error" && (
                  <> {countdown}초 후 설정 창을 엽니다…</>
                )}
                {notice.kind === "server_error" && (
                  <> {countdown}초 후 창을 닫습니다…</>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      <ConfigEditor
        isOpen={isConfigOpen}
        defaultConfig={currentServerConfig}
        setConfig={handleConfigSave}
        onClose={handleConfigClose}
      />
    </>
  );
}
