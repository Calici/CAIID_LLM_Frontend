import axiosInstance from "./axiosInstance";

export type WorkspaceSummary = { name: string; uuid: string };
// use for listWorkSpaces()

/** 워크스페이스 목록 가져오기 **/
export function listWorkspaces(): Promise<WorkspaceSummary[]> {
  return axiosInstance
    .get<WorkspaceSummary[]>(`/workspace.summary`)
    .then((response) => response.data);
}

// export type MessageT =
//   | { type: "user"; content: string }
//   | { type: "ai"; content: string }
//   | { type: "tool_call"; tool_name: string; tool_id: string; tool_call_id: string; is_complete: boolean }
//   | { type: "ai_end" }; // server sends as separate SSE event

/* Message History Structure */
export type UserMessageT = {
  type: "user";
  content: string;
};
export type ModelMessageT = {
  type: "ai";
  content: string;
};
export type ToolCallT = {
  type: "tool_call";
  tool_name: string;
  tool_id: string;
  tool_call_id: string;
  is_complete: boolean;
};

/* This defines the messages that the model will send. I.e. returned from the SSE event */
export type ModelResponseT = ModelMessageT | ToolCallT;

/* This defines the whole structure */
export type MessageT = UserMessageT | ModelMessageT | ToolCallT;
export type HistoryT = MessageT[];

/* Workspace State */
export type StateT = {
  messages: MessageT[];
  queries: {
    title: string;
    source: string;
    abstract: string | null;
    authors: string[];
    link: string | null;
  }[];
};

export type Workspace = {
  //use for createWorkSpace() and getWorkSpace()
  name: string;
  uuid: string;
  chat_history: StateT;
  last_modified: string;
  create_date: string;
};
export function getWorkspace(uuid: string): Promise<Workspace> {
  return axiosInstance
    .get<Workspace>(`/workspace/${uuid}`)
    .then((response) => response.data);
}

export function renameWorkspace(
  uuid: string,
  payload: { name: string },
): Promise<void> {
  return axiosInstance.post(`/workspace.rename/${uuid}`, payload).then(() => {
    return undefined;
  });
}

export function deleteWorkspace(uuid: string): Promise<void> {
  return axiosInstance.delete(`/workspace/${uuid}`).then(() => {
    return undefined;
  });
}
/* createWorkspace/streamChat helpers intentionally omitted */
export type FileRow = {
  // use for fsList()
  name: string;
  summary: string;
  uuid: string;
};

export function fsList(): Promise<FileRow[]> {
  return axiosInstance
    .get<FileRow[]>(`/fs.ls`)
    .then((response) => response.data);
}

export function fsTempUpload(
  name: string,
  file: File,
  summary?: string,
): Promise<{ uuid: string }> {
  const formData = new FormData();
  formData.append("name", name);
  if (summary) formData.append("summary", summary);
  if (file) formData.append("file", file);
  return axiosInstance
    .post<{ uuid: string }>(`/fs.temp_upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    .then((response) => response.data);
}

export type ConfirmedFile = {
  //return for fsConfirmUpload
  name: string;
  summary: string;
  uuid: string;
  create_date: string;
  last_modified: string;
};
export function fsConfirmUpload(
  tempFileUuid: string,
  payload: { name: string; summary: string },
): Promise<ConfirmedFile> {
  return axiosInstance
    .post<ConfirmedFile>(`/fs.confirm_upload/${tempFileUuid}`, payload)
    .then((response) => response.data);
}

export function fsDownloadUrl(file_uuid: string): Promise<string> {
  return axiosInstance
    .get<string>(`/fs.download_file/${file_uuid}`)
    .then((response) => response.data);
}

export function agentMakeTopic(workspaceUuid: string): Promise<string> {
  return axiosInstance
    .get<string>(`/agent.topic_maker/${workspaceUuid}`)
    .then((response) => response.data);
}

export function agentSummariseFile(tempFileUuid: string): Promise<string> {
  return axiosInstance
    .get<string>(`/agent.summarise_file/${tempFileUuid}`)
    .then((response) => response.data);
}

export function fsDelete(fileUuid: string): Promise<void> {
  return axiosInstance.delete(`/fs/${fileUuid}`).then(() => {
    return undefined;
  });
}

export type ServerConfig = {
  username: string | null;
  name: string | null;
  model_name: string | null;
  api_url: string | null;
};

export type ServerPayload = {
  username: string;
  name: string;
  model_name: string;
  api_url: string;
  api_key: string;
};

/** [GET] /server : 현재 LLM 서버 설정 조회 */
export function getLlmServer(): Promise<ServerConfig> {
  return axiosInstance.get<ServerConfig>("/server").then((resp) => resp.data);
}

/** [POST] /server.update : LLM 추론 서버 설정 업데이트 */
export function updateLlmServer(payload: ServerPayload): Promise<any> {
  return axiosInstance.post<Omit<ServerPayload, "">>("/server.update", payload);
}

/** 남은 wrapper : 	listWorkspaces()	GET	워크스페이스 목록 가져오기 #
	createWorkspace(payload)	POST	새 워크스페이스 생성  #
	getWorkspace(uuid)	GET	특정 워크스페이스 세부 정보 조회 #
	renameWorkspace(uuid, payload)	POST	워크스페이스 이름 변경 #
	streamChat(uuid, payload, handlers)	POST (SSE)	채팅 요청 및 스트림 받기 ????
Filesystem (파일 관련)	fsList()	GET	업로드된 파일 목록 불러오기 #
	fsTempUpload(formData)	POST	임시 파일 업로드 #
	fsConfirmUpload(uuid, payload)	POST	임시 업로드 파일 확정 등록 #
	fsDownloadUrl(uuid)	(URL 생성)	파일 다운로드 링크 반환 #
Agent (AI 자동 기능)	agentMakeTopic(uuid)	GET	워크스페이스 주제 자동 생성
	agentSummariseFile(uuid) GET 특정 파일 요약
   **/
