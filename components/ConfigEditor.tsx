import { useCallback, useEffect, useMemo, useState, type Key } from "react";
import { useTheme } from "next-themes";
import { useIsSSR } from "@react-aria/ssr";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Tabs, Tab } from "@heroui/tabs";
import { Select, SelectItem } from "@heroui/select";
import { Switch } from "@heroui/switch";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import SafeButton from "./safebutton/safebutton";
import { useFormInput } from "@/hooks/useFormInput";
import type { ServerConfig, ServerPayload } from "@/app/api/wrappers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";

type Mode = "lite" | "heavy";

type ConfigEditorProps = {
  isOpen: boolean;
  defaultConfig: ServerConfig;
  setConfig: (config: ServerPayload) => Promise<any>;
  onClose: () => void;
};

const DEFAULT_OPENAI_URL = "https://api.openai.com/v1";
const GROQ_OPENAI_COMPAT_URL = "https://api.groq.com/openai/v1";
const CUSTOM_MODEL_KEY = "__custom__";

const MODEL_OPTIONS = [
  // { label: "GPT-5", value: "gpt-5" },
  // { label: "GPT-5-mini", value: "gpt-5-mini" },
  // { label: "GPT-5-pro", value: "gpt-5-pro" },
  { label: "GPT-5-nano", value: "gpt-5-nano" },
  // { label: "gpt-4o-mini", value: "gpt-4o-mini" },
  { label: "직접 입력 (Groq 등)", value: CUSTOM_MODEL_KEY },
];

const inferMode = (modelName: string, apiUrl: string): Mode => {
  if (modelName === "gpt-5-nano" && apiUrl === DEFAULT_OPENAI_URL) {
    return "lite";
  }
  return "heavy";
};

const emptyError: string[] = [];

export default function ConfigEditor({
  isOpen,
  defaultConfig,
  setConfig,
  onClose,
}: ConfigEditorProps) {
  const [username, setUsername, usernameErrors, setUsernameErrors] =
    useFormInput<string>(defaultConfig.username || "");
  const [modelName, setModelName, modelErrors, setModelErrors] =
    useFormInput<string>(defaultConfig.model_name || "");
  const [modelSelect, setModelSelect] = useState<string>(() => {
    const values = MODEL_OPTIONS.map((o) => o.value);
    return values.includes(defaultConfig.model_name || "")
      ? (defaultConfig.model_name as string)
      : CUSTOM_MODEL_KEY;
  });
  const [apiUrl, setApiUrl, apiUrlErrors, setApiUrlErrors] =
    useFormInput<string>(defaultConfig.api_url || DEFAULT_OPENAI_URL);
  const [apiKey, setApiKey, apiKeyErrors, setApiKeyErrors] =
    useFormInput<string>("");
  const [mode, setMode] = useState<Mode>("lite");

  const { theme, setTheme, resolvedTheme } = useTheme();
  const isSSR = useIsSSR();

  useEffect(() => {
    setUsername(defaultConfig.username || "");
    setModelName(defaultConfig.model_name || "gpt-5-nano");
    setApiUrl(defaultConfig.api_url || DEFAULT_OPENAI_URL);
    const values = MODEL_OPTIONS.map((o) => o.value);
    setModelSelect(
      values.includes(defaultConfig.model_name || "")
        ? (defaultConfig.model_name as string)
        : CUSTOM_MODEL_KEY
    );
  }, [defaultConfig]);

  const handleModeChange = useCallback(
    (nextMode: Mode) => {
      if (nextMode === "lite") {
        setApiUrl(DEFAULT_OPENAI_URL);
        setModelName("gpt-5-nano");
        setModelSelect("gpt-5-nano");
        setApiKey("");
      } else {
        // setModelName("gpt-5-nano");
        setApiUrl("");
        setApiKey("");
      }
      setMode(nextMode);
    },
    [setApiKey, setApiUrl, setModelName, setMode]
  );

  const validate = useCallback(() => {
    let hasError = false;
    const trimmedUsername = username.trim();
    const trimmedApiUrl = apiUrl.trim();
    const trimmedModelName = modelName.trim();
    const trimmedKey = apiKey.trim();

    setUsernameErrors((prev) => (prev.length ? emptyError : prev));
    setModelErrors((prev) => (prev.length ? emptyError : prev));
    setApiUrlErrors((prev) => (prev.length ? emptyError : prev));
    setApiKeyErrors((prev) => (prev.length ? emptyError : prev));

    if (!trimmedUsername) {
      hasError = true;
      setUsernameErrors(["Username is required."]);
    }
    if (!trimmedModelName) {
      hasError = true;
      setModelErrors(["Model must be selected."]);
    }
    if (!trimmedApiUrl) {
      hasError = true;
      setApiUrlErrors(["API URL cannot be empty."]);
    }
    if (mode === "lite" && !trimmedKey) {
      hasError = true;
      setApiKeyErrors(["API key is required."]);
    }

    return {
      hasError,
      trimmedUsername,
      trimmedModelName,
      trimmedApiUrl,
      trimmedKey,
    };
  }, [
    apiKey,
    apiUrl,
    modelName,
    username,
    setApiKeyErrors,
    setApiUrlErrors,
    setModelErrors,
    setUsernameErrors,
  ]);

  const handleSave = useCallback(() => {
    const {
      hasError,
      trimmedUsername,
      trimmedModelName,
      trimmedApiUrl,
      trimmedKey,
    } = validate();

    if (hasError) {
      return Promise.resolve(null);
    }

    return Promise.resolve(
      setConfig({
        username: trimmedUsername,
        name: "NO_OP",
        model_name: trimmedModelName,
        api_url: trimmedApiUrl,
        api_key: trimmedKey,
      })
    ).then(() => {
      setApiKey("");
      onClose();
    });
  }, [validate, setConfig, onClose]);

  const handleModeSelection = useCallback(
    (key: Key) => {
      handleModeChange(key === "lite" ? "lite" : "heavy");
    },
    [handleModeChange]
  );

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      placement="center"
      hideCloseButton
      isDismissable={false}
    >
      <ModalContent>
        <>
          <ModalHeader className="text-sm">설정</ModalHeader>
          <ModalBody className="flex flex-col gap-y-8">
            <Input
              placeholder="John Doe"
              type="text"
              startContent={<FontAwesomeIcon icon={faUser} />}
              value={username}
              isInvalid={usernameErrors.length > 0}
              errorMessage={usernameErrors.join(" ")}
              onValueChange={(v) => {
                setUsername(v);
                if (usernameErrors.length) setUsernameErrors(emptyError);
              }}
            />
            <div className="flex flex-col gap-y-2">
              <div className="flex flex-row items-center justify-between">
                <h2>모드 설정</h2>
                <Tabs
                  selectedKey={mode}
                  onSelectionChange={handleModeSelection}
                  color="primary"
                  variant="solid"
                  classNames={{
                    tab: "h-8 px-3 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground",
                  }}
                >
                  <Tab key="lite" title="라이트" />
                  <Tab key="heavy" title="헤비" />
                </Tabs>
              </div>

              <div
                className="aria-hidden:hidden"
                aria-hidden={mode === "heavy"}
              >
                <Select
                  label={<p>모델 종류</p>}
                  selectedKeys={[modelSelect]} // ★변경
                  onSelectionChange={(keys) => {
                    const { currentKey } = keys as { currentKey?: Key };
                    if (typeof currentKey === "string") {
                      setModelSelect(currentKey); // ★추가
                      if (currentKey === CUSTOM_MODEL_KEY) {
                        // '직접 입력' 선택 → 아래 인풋에서 모델명을 입력
                        setModelName("");
                        // 사용자가 OpenAI 기본 URL을 쓰고 있었다면 Groq 호환 URL로 1회 자동 채움
                        setApiUrl((prev) =>
                          prev.trim() === DEFAULT_OPENAI_URL
                            ? GROQ_OPENAI_COMPAT_URL
                            : prev
                        );
                      } else {
                        setModelName(currentKey);
                      }
                      if (modelErrors.length) setModelErrors(emptyError);
                    }
                  }}
                >
                  {MODEL_OPTIONS.map((option) => (
                    <SelectItem key={option.value}>{option.label}</SelectItem>
                  ))}
                </Select>
                {modelSelect === CUSTOM_MODEL_KEY && (
                  <Input
                    className="mt-2"
                    label="모델명 직접 입력"
                    placeholder="예: llama-3.1-8b-instant (Groq)"
                    value={modelName}
                    isInvalid={modelErrors.length > 0}
                    errorMessage={modelErrors.join(" ")}
                    onValueChange={(v) => {
                      setModelName(v);
                      if (modelErrors.length) setModelErrors(emptyError);
                    }}
                  />
                )}
                {modelSelect !== CUSTOM_MODEL_KEY && modelErrors.length > 0 && (
                  <p className="mt-1 text-xs text-danger-500">
                    {modelErrors.join(" ")}
                  </p>
                )}

                {modelErrors.length > 0 && (
                  <p className="mt-1 text-xs text-danger-500">
                    {modelErrors.join(" ")}
                  </p>
                )}
              </div>

              <Input
                label="API 주소 (URL)"
                fullWidth
                placeholder="https://llm.example.com/v1"
                variant="bordered"
                value={apiUrl}
                isInvalid={apiUrlErrors.length > 0}
                errorMessage={apiUrlErrors.join(" ")}
                onValueChange={(v) => {
                  setApiUrl(v);
                  if (apiUrlErrors.length) setApiUrlErrors(emptyError);
                }}
              />

              <Input
                label="API 키 (Key)"
                placeholder="sk-**************************"
                variant="bordered"
                type="password"
                fullWidth
                value={apiKey}
                isInvalid={apiKeyErrors.length > 0}
                errorMessage={apiKeyErrors.join(" ")}
                onValueChange={(v) => {
                  setApiKey(v);
                  if (apiKeyErrors.length) setApiKeyErrors(emptyError);
                }}
              />
            </div>
            <div className="flex flex-row items-center justify-between">
              <h2>다크 모드</h2>
              <Switch
                size="sm"
                isSelected={(resolvedTheme ?? theme) === "dark"}
                onValueChange={(on) => setTheme(on ? "dark" : "light")}
                aria-label="Toggle dark mode"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <SafeButton color="primary" onPress={handleSave}>
              저장
            </SafeButton>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
}
