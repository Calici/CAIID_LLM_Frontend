// app/api/chatStream.ts
import axiosInstance from "./axiosInstance";
import { ModelMessageT, ModelResponseT, StateT } from "./wrappers";
type ChatPayload = {
  user_prompt: string;
  uuid?: string; // 없으면 서버가 새 워크스페이스 생성
};

export function parseFromRaw(v: string): [string[], string | null] {
  // let removed_newline = v.split("\n");
  // removed_newline = removed_newline.filter((word) => word.length >= 1);
  // const main_body = removed_newline.map((v) => v.slice(6,-1))
  // console.log(main_body)
  // return [];
  const newlineSeparated = v.split("\n");
  if (newlineSeparated.slice(-1)[0].length === 0)
    return [newlineSeparated.slice(0, -1), null]; // no remains after newline
  else return [newlineSeparated.slice(0, -1), newlineSeparated.slice(-1)[0]];
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
    };

export function parseToJSON(v: string): ChatT {
  return JSON.parse(v);
}

type Handlers = {
  onChat: (v: ModelResponseT) => void;
  onRecord: (name: string, uuid: string) => void;
  onQuery: (v: PublicationT[]) => void;
  onEnd?: () => void
};

export async function postChatStream(payload: ChatPayload, handlers: Handlers) {
  const resp = await fetch(`${axiosInstance.defaults.baseURL}/workspace.chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok || !resp.body) {
    throw new Error(`HTTP ${resp.status}`);
  }

  const reader = resp.body
    .pipeThrough(new TextDecoderStream("utf-8"))
    .getReader();

  let done: boolean = false;
  let remainsCache = "";
  while (!done) {
    const { value, done: isEnd } = await reader.read();
    done = isEnd;
    //console.log(i, value);
    if (value === undefined) {
      continue;
    }
    // [string[], string | null]
    const [parsed, remains] = parseFromRaw(remainsCache + value);
    if (remains !== null) {
      remainsCache = remains;
    } else {
      remainsCache = "";
    }
    parsed.map(parseToJSON).forEach((element) => {
      if (element.type === "chat") {
        handlers.onChat(element.content);
      } else if (element.type === "record") {
        handlers.onRecord(element.content.name, element.content.uuid);
      } else if (element.type === "query") {
        handlers.onQuery(element.content);
      }
    });
    // if(element.type === "chat"){handlers.onChat(element.content)}
    // else if(element.type === "record"){handlers.onRecord(element.content.name,element.content.uuid)}
    // else if(element.type === "query"){handlers.onQuery(element.content)}
    // });
    // append
  }
  handlers.onEnd?.()
}
