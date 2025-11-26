// app/api/chatStream.ts
import axiosInstance from "./axiosInstance";
import { ModelMessageT, ModelResponseT, StateT } from "./wrappers";
type ChatPayload = {
  user_prompt: string;
  uuid?: string;
};

export function parseFromRaw(v: string): [string[], string | null] {
  const newlineSeparated = v.split("\n");
  if (newlineSeparated.slice(-1)[0].length === 0) {
    return [newlineSeparated.slice(0, -1), null];
  }
  return [newlineSeparated.slice(0, -1), newlineSeparated.slice(-1)[0]];
}
export type PublicationT = {
  title: string;
  source: string;
  abstract: string | null;
  authors: string[];
  link: string | null;
};

type ChatT =
  | {
      type: "chat";
      content: ModelResponseT;
    }
  | {
      type: "record";
      content: {
        name: string;
        uuid: string;
        chat_history: StateT;
        last_modified: string;
        create_date: string;
      };
    }
  | {
      type: "query";
      content: PublicationT[];
    } | {
      type: "error",
      content: string
    };

export function parseToJSON(v: string): ChatT {
  return JSON.parse(v);
}

type Handlers = {
  onChat: (v: ModelResponseT) => void;
  onRecord: (name: string, uuid: string) => void;
  onQuery: (v: PublicationT[]) => void;
  onEnd?: () => void;
  onError?: (status: number, err?: any) => void; // HTTP or Network Error 
  onStreamError?: (msg: string) => void; // type:"error"
};

export function postChatStream(payload: ChatPayload, handlers: Handlers) {
  let remainsCache = "";

  const processReader = (
    reader: ReadableStreamDefaultReader<string>
  ): Promise<null> =>
    reader.read().then(({ value, done }) => {
      if (done) {
        return Promise.resolve(null);
      }

      if (value !== undefined) {
        const [parsed, remains] = parseFromRaw(remainsCache + value);
        remainsCache = remains ?? "";

        parsed.map(parseToJSON).forEach((element) => {
          if (element.type === "chat") {
            console.log(element.content);
            handlers.onChat(element.content);
          } else if (element.type === "record") {
            handlers.onRecord(element.content.name, element.content.uuid);
          } else if (element.type === "query") {
            handlers.onQuery(element.content);
          } else if (element.type === "error") {
            handlers.onStreamError?.(element.content);
          }
        });
      }

      return processReader(reader);
    });

  return fetch(`${axiosInstance.defaults.baseURL}/workspace.chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(payload),
  })
    .then((resp) => {
      if (!resp.ok || !resp.body) {
        return resp
          .text()
          .catch(() => "")
          .then((text) => {
            handlers.onError?.(resp.status, text);
            handlers.onEnd?.();
            return null;
            // throw new Error(
            //   text ? `HTTP ${resp.status} ${text}` : `HTTP ${resp.status}`,
            // );
          });
      }

      const reader = resp.body
        .pipeThrough(new TextDecoderStream("utf-8"))
        .getReader();

      return processReader(reader);
    })
    .then(() => {
      handlers.onEnd?.();
      return null;
    })
    .catch((err) => {
      const status = err?.response?.status ?? err?.status ?? 0;
      handlers.onError?.(status, err);
      handlers.onEnd?.();
      return null;
    });
}
