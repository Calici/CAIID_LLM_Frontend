export type Datestring = string;

export type MessageT =
  | { type: "user"; content: string }
  | { type: "ai"; content: string };

export type Workspace = {
  name: string;
  uuid: string;
  chat_history: MessageT[];
  last_modified: Datestring;
  create_date: Datestring;
};

let _id = 1;
function makeUuid() {
  // 개발 편의용 간단 UUID; 원하면 crypto.randomUUID() 써도 됨.
  return `ws_mock_${_id++}`;
}
function nowISO(): Datestring {
  return new Date().toISOString();
}

const workspaces = new Map<string, Workspace>();

// 초기 데이터 몇 개
(function seed() {
  const a: Workspace = {
    name: "Antiviral Search",
    uuid: makeUuid(),
    chat_history: [],
    create_date: nowISO(),
    last_modified: nowISO(),
  };
  const b: Workspace = {
    name: "Oncology Project",
    uuid: makeUuid(),
    chat_history: [],
    create_date: nowISO(),
    last_modified: nowISO(),
  };
  const c: Workspace = {
    name: "Oncology Project",
    uuid: makeUuid(),
    chat_history: [],
    create_date: nowISO(),
    last_modified: nowISO(),
  };
  workspaces.set(a.uuid, a);
  workspaces.set(b.uuid, b);
  workspaces.set(c.uuid, c);
})();

export const db = {
  listSummaries() {
    return Array.from(workspaces.values()).map((w) => ({
      name: w.name,
      uuid: w.uuid,
    }));
  },
  getWorkspace(uuid: string) {
    return workspaces.get(uuid) ?? null;
  },
  createWorkspace(input: { name?: string; user_prompt: string }) {
    const ws: Workspace = {
      name: input.name ?? `Workspace ${_id}`,
      uuid: makeUuid(),
      chat_history: [], // user_prompt를 초기 히스토리에 넣고 싶으면 여기 반영
      create_date: nowISO(),
      last_modified: nowISO(),
    };
    workspaces.set(ws.uuid, ws);
    return ws;
  },
  renameWorkspace(uuid: string, name: string) {
    const ws = workspaces.get(uuid);
    if (!ws) return null;
    ws.name = name;
    ws.last_modified = nowISO();
    return ws;
  },
};
