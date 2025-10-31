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

const MODEL_OPTIONS = [
  { label: "GPT-5", value: "gpt-5" },
  { label: "GPT-5-mini", value: "gpt-5-mini" },
  { label: "GPT-5-pro", value: "gpt-5-pro" },
  { label: "GPT-5-nano", value: "gpt-5-nano" },
  { label: "gpt-4o-mini", value: "gpt-4o-mini" },
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
  const [apiUrl, setApiUrl, apiUrlErrors, setApiUrlErrors] =
    useFormInput<string>(defaultConfig.api_url || "");
  const [apiKey, setApiKey, apiKeyErrors, setApiKeyErrors] =
    useFormInput<string>("");
  const [mode, setMode] = useState<Mode>("heavy");

  const { theme, setTheme, resolvedTheme } = useTheme();
  const isSSR = useIsSSR();

  useEffect(() => {
    setUsername(defaultConfig.username || "");
    setModelName(defaultConfig.model_name || "");
    setApiUrl(defaultConfig.api_url || "");
  }, [defaultConfig]);

  const handleModeChange = useCallback(
    (nextMode: Mode) => {
      if (nextMode === "lite") {
        setApiUrl(DEFAULT_OPENAI_URL);
        setModelName("gpt-5-nano");
        setApiKey("");
      } else {
        setApiUrl("");
        setApiKey("");
      }
      setMode(nextMode);
    },
    [setApiKey, setApiUrl, setModelName, setMode],
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
    if (!trimmedKey) {
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
      }),
    ).then(() => {
      setApiKey("");
      onClose();
    });
  }, [validate, setConfig, onClose]);

  const handleModeSelection = useCallback(
    (key: Key) => {
      handleModeChange(key === "lite" ? "lite" : "heavy");
    },
    [handleModeChange],
  );

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      placement="center"
    >
      <ModalContent>
        <>
          <ModalHeader className="text-sm">Settings</ModalHeader>
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
                <h2>Model Config</h2>
                <Tabs
                  selectedKey={mode}
                  onSelectionChange={handleModeSelection}
                >
                  <Tab key="lite" title="Lite" />
                  <Tab key="heavy" title="Heavy" />
                </Tabs>
              </div>

              <div
                className="aria-hidden:hidden"
                aria-hidden={mode === "heavy"}
              >
                <Select
                  label={<p>Model Name</p>}
                  selectedKeys={modelName ? [modelName] : []}
                  onSelectionChange={(keys) => {
                    const { currentKey } = keys;
                    if (typeof currentKey === "string") {
                      setModelName(currentKey);
                      if (modelErrors.length) setModelErrors(emptyError);
                    }
                  }}
                >
                  {MODEL_OPTIONS.map((option) => (
                    <SelectItem key={option.value}>{option.label}</SelectItem>
                  ))}
                </Select>
                {modelErrors.length > 0 && (
                  <p className="mt-1 text-xs text-danger-500">
                    {modelErrors.join(" ")}
                  </p>
                )}
              </div>

              <Input
                label="API URL"
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
                label="API Key"
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
              <h2>Dark Mode</h2>
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
              Save
            </SafeButton>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
}
