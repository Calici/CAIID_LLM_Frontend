"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUp,
  faCheck,
  faPen,
  faTrash,
  faUpload,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

import type { MessageT } from "@/app/api/wrappers";
import ChatCard from "./ChatCard";
import SafeButton from "./safebutton/safebutton";

type ChatPanelProps = {
  messages: MessageT[];
  sendMessage: (msg: string) => void;
  isGenerating: boolean;
  workspaceName: string;
  canEditWorkspace: boolean;
  onRenameWorkspace: (name: string) => Promise<any>;
  onDeleteWorkspace: () => Promise<any>;
  showGreeting: boolean;
  username: string | null;
};

export default function ChatPanel({
  messages,
  sendMessage,
  isGenerating,
  workspaceName,
  canEditWorkspace,
  onRenameWorkspace,
  onDeleteWorkspace,
  showGreeting,
  username,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameDraft, setRenameDraft] = useState(workspaceName);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length]);

  useEffect(() => {
    if (!isRenaming) {
      setRenameDraft(workspaceName);
    }
  }, [workspaceName, isRenaming]);

  const displayName = workspaceName;
  const disableActions = !canEditWorkspace;

  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  }, [input, sendMessage, setInput]);

  const handleRenameSubmit = useCallback(() => {
    if (disableActions) {
      setIsRenaming(false);
      return Promise.resolve(null);
    }
    const trimmed = renameDraft.trim();
    if (!trimmed) return Promise.resolve(null);
    if (trimmed === workspaceName) {
      setIsRenaming(false);
      return Promise.resolve(null);
    }
    return Promise.resolve(onRenameWorkspace(trimmed)).then(() => {
      setIsRenaming(false);
      return null;
    });
  }, [
    disableActions,
    renameDraft,
    workspaceName,
    onRenameWorkspace,
    setIsRenaming,
  ]);

  const handleRenameCancel = useCallback(() => {
    setRenameDraft(workspaceName);
    setIsRenaming(false);
  }, [workspaceName, setRenameDraft, setIsRenaming]);

  const handleDelete = useCallback(() => {
    if (disableActions) return Promise.resolve(null);
    return Promise.resolve(onDeleteWorkspace());
  }, [disableActions, onDeleteWorkspace]);

  if (showGreeting) {
    const displayUsername = username?.trim() ? username.trim() : "there";
    return (
      <div className="flex flex-col h-full items-center justify-center mx-8 gap-y-4">
        <div className="flex flex-col gap-y-2 text-center w-full">
          <h1 className="text-3xl font-semibold text-muted-100">
            {`Hi ${displayUsername},`}
          </h1>
          <p className="text-lg text-muted-400">How can I help you?</p>
        </div>
        <div className="flex flex-row gap-x-2 w-full">
          <Textarea
            minRows={1}
            maxRows={8}
            value={input}
            onValueChange={setInput}
            placeholder="Type your message... (Enter: Send, Shift+Enter: New line)"
            className="flex-1"
            variant="bordered"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            endContent={
              <Button
                color="primary"
                onPress={handleSend}
                isLoading={isGenerating}
                isIconOnly
              >
                <FontAwesomeIcon icon={faArrowUp} />
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="hidden items-center justify-between border-b border-surface-strong px-4 py-3 lg:flex w-full">
        <div className="w-full">
          <div className="flex flex-row justify-between w-full items-center gap-2">
            <div className="flex min-w-0 items-center gap-2 flex-1">
              {isRenaming ? (
                <>
                  <Input
                    size="sm"
                    value={renameDraft}
                    onValueChange={setRenameDraft}
                    className="flex-1"
                    autoFocus
                    aria-label="Workspace name"
                  />
                  <SafeButton
                    isIconOnly
                    size="sm"
                    variant="light"
                    color="primary"
                    aria-label="Save workspace name"
                    onPress={handleRenameSubmit}
                    isDisabled={!renameDraft.trim()}
                  >
                    <FontAwesomeIcon icon={faCheck} />
                  </SafeButton>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    aria-label="Cancel rename"
                    onPress={handleRenameCancel}
                    disableRipple
                  >
                    <FontAwesomeIcon icon={faXmark} />
                  </Button>
                </>
              ) : (
                <>
                  <h2 className="truncate text-ellipsis text-sm font-semibold">
                    {displayName}
                  </h2>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    aria-label="Rename workspace"
                    onPress={() => {
                      setRenameDraft(workspaceName);
                      setIsRenaming(true);
                    }}
                    isDisabled={disableActions}
                    disableRipple
                  >
                    <FontAwesomeIcon icon={faPen} />
                  </Button>
                </>
              )}
            </div>
            <SafeButton
              isIconOnly
              size="sm"
              variant="light"
              color="danger"
              aria-label="Delete workspace"
              onPress={handleDelete}
              isDisabled={disableActions}
              className="ml-auto"
            >
              <FontAwesomeIcon icon={faTrash} />
            </SafeButton>
          </div>
        </div>
        <div className="text-xs text-muted-400">
          {isGenerating ? "Streaming..." : ""}
        </div>
      </div>

      <div ref={scrollRef} className="h-full overflow-auto p-4">
        <div className="mx-auto max-w-3xl space-y-3">
          {messages
            .map((m, id) => ({
              m,
              showAvatar:
                id === 0 ||
                m.type === "user" ||
                (messages[id - 1]?.type === "user" &&
                  (m.type === "ai" || m.type === "tool_call")),
              isLoading: false,
            }))
            .map((props, id) => (
              <ChatCard key={id} {...props} />
            ))}
        </div>
      </div>

      <div className="border-t border-surface-strong p-3">
        <Textarea
          minRows={1}
          maxRows={8}
          value={input}
          onValueChange={setInput}
          placeholder="Type your message... (Enter: Send, Shift+Enter: New line)"
          className="flex-1"
          variant="bordered"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          endContent={
            <Button
              color="primary"
              onPress={handleSend}
              isLoading={isGenerating}
              isIconOnly
            >
              <FontAwesomeIcon icon={faArrowUp} />
            </Button>
          }
        />
      </div>
    </div>
  );
}
