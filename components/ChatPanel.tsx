"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUp,
  faCheck,
  faPen,
  faTrash,
  faUpload,
  faWandMagicSparkles,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

import { agentContinuation, type MessageT } from "@/app/api/wrappers";
import ChatCard from "./ChatCard";
import SafeButton from "./safebutton/safebutton";
import { Popover, PopoverContent, PopoverTrigger } from "@heroui/popover";
import { Spinner } from "@heroui/spinner";
import { useDisclosure } from "@heroui/modal";

type ChatAreaP = {
  value: string;
  setValue: React.Dispatch<React.SetStateAction<string>>;
  send: () => void;
  isGenerating: boolean;
  uuid: string | null;
};

function ChatArea({ value, setValue, send, isGenerating, uuid }: ChatAreaP) {
  const [choices, setChoices] = useState<string[] | null>([]);

  const getChoices = useCallback(() => {
    if (uuid === null) {
      setChoices([
        "Get me publications on HIV",
        "Show me the files I have",
        "Tell me about clinical trials related to HPV",
      ]);
      return;
    } else {
      setChoices(null);
      agentContinuation(uuid).then(setChoices);
    }
  }, [uuid]);
  const { isOpen, onOpenChange } = useDisclosure();
  return (
    <Textarea
      minRows={1}
      maxRows={8}
      value={value}
      onValueChange={setValue}
      placeholder="Look up publications for HIV"
      className="flex-1"
      variant="bordered"
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          send();
        }
      }}
      endContent={
        <div className="flex flex-row gap-x-2">
          <Popover
            isOpen={isOpen}
            showArrow
            onOpenChange={() => {
              onOpenChange();
              getChoices();
            }}
          >
            <PopoverTrigger>
              <Button isIconOnly color="primary" isDisabled={isGenerating}>
                <FontAwesomeIcon icon={faWandMagicSparkles} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="min-w-96 min-h-40 flex flex-col p-4 justify-start items-start">
              <Spinner
                aria-hidden={choices !== null}
                className="aria-hidden:hidden self-center justify-self-center"
              />
              <div
                className="aria-hidden:hidden self-center justify-self-center"
                aria-hidden={choices === null || choices.length !== 0}
              >
                <p className="font-light text-gray-400 text-xl">
                  No Recommendations
                </p>
              </div>
              <div
                className="aria-hidden:hidden flex flex-col gap-x-2 w-full"
                aria-hidden={choices === null || choices.length === 0}
              >
                {(choices || []).map((choice) => (
                  <Button
                    key={choice}
                    className="justify-start p-2 w-full"
                    onPress={() => {
                      setValue(choice);
                      send();
                      onOpenChange();
                    }}
                    variant="light"
                  >
                    {choice}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <Button
            color="primary"
            onPress={send}
            isLoading={isGenerating}
            isIconOnly
          >
            <FontAwesomeIcon icon={faArrowUp} />
          </Button>
        </div>
      }
    />
  );
}

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
  uuid: string | null;
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
  uuid,
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

  if (uuid === null) {
    return (
      <div className="flex flex-col h-full items-center justify-center mx-8 gap-y-4">
        <div className="flex flex-col gap-y-2 text-center w-full">
          <h1 className="text-3xl font-semibold text-muted-100">
            Hi {username}
          </h1>
          <p className="text-lg text-muted-400">How can I help ?</p>
        </div>
        <div className="flex flex-row gap-x-2 w-full">
          <ChatArea
            value={input}
            setValue={setInput}
            send={handleSend}
            uuid={uuid}
            isGenerating={isGenerating}
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
        <ChatArea
          value={input}
          setValue={setInput}
          send={handleSend}
          uuid={uuid}
          isGenerating={isGenerating}
        />
      </div>
    </div>
  );
}
