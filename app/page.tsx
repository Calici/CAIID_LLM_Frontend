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

function useWorkspace(
  uuid: string | null,
  appendUuid: (name: string, uuid: string) => void,
) {
  const [workspace, setWorkspace] = useState<WorkspaceMeta | null>(null);
  const [messages, setMessages] = useState<HistoryT>([]);
  const [queries, setQueries] = useState<StateT["queries"]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  useEffect(() => {
    if (uuid === null) {
      setWorkspace(null);
      setMessages([]);
      setQueries([]);
      return;
    }
    getWorkspace(uuid).then((workspaceResponse) => {
      const { chat_history, ...meta } = workspaceResponse;
      setWorkspace(meta);
      setMessages(chat_history.messages);
      setQueries(chat_history.queries);
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
        },
      );
    },
    [uuid, appendUuid],
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
    [pathname, router, searchParams],
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
    [pathname, router, searchParams],
  );

  const appendUuid = useCallback(
    (name: string, uuid: string) => {
      setWorkspaces((prevWorkspaces) => [{ name, uuid }, ...prevWorkspaces]);
      setActiveUuid(uuid);
    },
    [setActiveUuid, setWorkspaces],
  );
  const {
    workspace,
    messages,
    queries,
    sendMessage,
    isGenerating,
    setWorkspaceName,
  } = useWorkspace(activeUuid, appendUuid);

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
              : workspaceItem,
          ),
        );
        if (uuid === activeUuid) {
          setWorkspaceName(trimmed);
        }
        return null;
      });
    },
    [activeUuid, setWorkspaceName, setWorkspaces],
  );

  const deleteWorkspaceByUuid = useCallback(
    (uuid: string) =>
      deleteWorkspace(uuid).then(() => {
        setWorkspaces((prev) =>
          prev.filter((workspaceItem) => workspaceItem.uuid !== uuid),
        );
        if (uuid === activeUuid) {
          setActiveUuid(null);
        }
        return null;
      }),
    [activeUuid, setActiveUuid, setWorkspaces],
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
        false,
      );
      if (haveNull) {
        setConfigOpen(true);
      }
    });
  }, []);

  const renameActiveWorkspace = useCallback(
    (name: string) => {
      if (!activeUuid) return Promise.resolve(null);
      return renameWorkspaceByUuid(activeUuid, name);
    },
    [activeUuid, renameWorkspaceByUuid],
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
    [serverConfig],
  );

  const handleConfigSave = useCallback(
    (config: ServerPayload) => {
      return updateLlmServer(config);
    },
    [setServerConfig],
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
