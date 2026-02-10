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
  faMicrophone,
} from "@fortawesome/free-solid-svg-icons";

import { agentContinuation, type MessageT } from "@/app/api/wrappers";
import ChatCard from "./ChatCard";
import SafeButton from "./safebutton/safebutton";
import { Popover, PopoverContent, PopoverTrigger } from "@heroui/popover";
import { Spinner } from "@heroui/spinner";
import { useDisclosure } from "@heroui/modal";

import useSpeechToText, { RecordingState } from "./speech_to_text";

type ChatAreaP = {
  value: string;
  setValue: React.Dispatch<React.SetStateAction<string>>;
  send: () => void;
  isGenerating: boolean;
  uuid: string | null;
};

type SpeechRecognition = any;
type SpeechRecognitionConstructor = new () => SpeechRecognition;
function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

function ChatArea({ value, setValue, send, isGenerating, uuid }: ChatAreaP) {
  type VoiceState = "IDLE" | "RECORDING" | "TRANSCRIBING";
  const [voiceState, setVoiceState] = useState<VoiceState>("IDLE"); // used for voice STT feature
  const [voiceError, setVoiceError] = useState<string | null>(null); // when STT errors, toast must show up
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [partialTranscript, setPartialTranscript] = useState("");

  const handleRecordedText = useCallback(
    (text: string) => {
      // Connect with previous text
      setValue(text);
      setVoiceState("IDLE"); // After Recognition, Change state to Idle
    },
    [setValue]
  );

  const { beginRecording, endRecording, toggleRecording, isRecording } =
    useSpeechToText({
      setRecordedText: handleRecordedText,
      continuous: false,  
      interimResult: true, 
      timeout: 10000, 
    });

  const recognitionRef = useRef<any>(null);
  useEffect(() => {
    const SR = getSpeechRecognitionConstructor();
    console.log("SpeechRecognition ctor:", SR);
    if (!SR) {
      console.warn("Web Speech API not supported in this browser.");
      setIsSpeechSupported(false);
      return;
    }
    setIsSpeechSupported(true);
    const recognition = new SR();
    recognition.lang = "ko-KR";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    // receieve STT result
    recognition.onresult = (event: any) => {
      let finalText = "";
      let interimText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) {
          finalText += res[0].transcript;
        } else {
          interimText += res[0].transcript;
        }
      }
      if (finalText) {
        const trimmed = finalText.trim();
        setPartialTranscript(trimmed);

        setValue((prev) => (prev ? `${prev} ${trimmed}` : trimmed));
        setVoiceState("IDLE");
      } else if (interimText) {
        setPartialTranscript(interimText.trim());
      }
    };
    recognition.onerror = (event: any) => {
      console.error("Speech error:", event.error);
      setVoiceError("음성인식 중 오류 발생 : 다시 시도해주세요");
    };
  }, []);

  const handleVoiceButtonClick = () => {
    if (voiceState === "IDLE") {
      setVoiceState("RECORDING");
      beginRecording();
    }
  };
  const handleVoiceConfirm = () => {
    if (voiceState === "RECORDING" && isRecording) {
      setVoiceState("TRANSCRIBING");
      // Fix later : add Transcribing action here
      // setTimeout(() => {
      //   setValue((prev) => (prev ? prev + "[voice sample]" : "[voice sample]")); // add text to text input area
      //   setVoiceState("IDLE");
      // }, 1000);
      endRecording();
    }
  };
  const handleVoiceCancel = () => {
    if(isRecording){
      endRecording();
    }
    // Fix later : add voice cancel logic here
    setVoiceState("IDLE");
  };

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
      placeholder="암 치료와 관련된 최근 publication들을 찾아주세요."
      className="flex-1"
      variant="bordered"
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
          e.preventDefault();
          send();
        }
      }}
      endContent={
        <div className="flex flex-row gap-x-2">
          {voiceState === "IDLE" ? (
            <Button
              isIconOnly
              color="danger"
              aria-label="start recording"
              onPress={handleVoiceButtonClick}
            >
              <FontAwesomeIcon icon={faMicrophone} />
            </Button>
          ) : (
            <div
              className="flex items-center gap-2 px-3 py-1
    rounded-full border
    bg-danger-50 border-danger-200 text-danger-700
    dark:bg-danger-900/20 dark:border-danger-700 dark:text-danger-300"
            >
              {/* Left animation placeholder */}
              <div className="w-4 h-4 rounded-full animate-pulse bg-danger-500 " />
              {/* Status text */}
              <span className="text-xs whitespace-nowrap">
                {voiceState === "RECORDING" ? "녹음 중..." : "변환 중..."}
              </span>
              {/* icon buttons on right */}
              <div className="flex items-center gap-1 ml-2">
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  color="danger"
                  isDisabled={voiceState === "TRANSCRIBING"}
                  onPress={handleVoiceConfirm}
                  aria-label="Confirm voice input"
                >
                  <FontAwesomeIcon icon={faCheck} />
                </Button>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  color="danger"
                  onPress={handleVoiceCancel}
                  aria-label="Cancel voice input"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </Button>
              </div>
            </div>
          )}
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
            안녕하세요 {username} 님!
          </h1>
          <p className="text-lg text-muted-400">무엇을 도와드릴까요?</p>
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
