import axiosInstance from "./axiosInstance";


export type WorkspaceSummary = { name: string; uuid: string };
// use for listWorkSpaces() 

/** 워크스페이스 목록 가져오기 **/
export async function listWorkspaces(): Promise<WorkspaceSummary[]> {
  const response =
    await axiosInstance.get<WorkspaceSummary[]>(`/workspace.summary`);
  return response.data;
}

// export type MessageT =
//   | { type: "user"; content: string }
//   | { type: "ai"; content: string }
//   | { type: "tool_call"; tool_name: string; tool_id: string; tool_call_id: string; is_complete: boolean }
//   | { type: "ai_end" }; // server sends as separate SSE event

/* Message History Structure */
export type UserMessageT = {
  type: "user", content: string
}
export type ModelMessageT = {
  type: "ai", content: string
}
export type ToolCallT = {
  type: "tool_call", tool_name: string, tool_id: string, tool_call_id: string, is_complete: boolean
}

/* This defines the messages that the model will send. I.e. returned from the SSE event */
export type ModelResponseT = ModelMessageT | ToolCallT

/* This defines the whole structure */
export type MessageT = UserMessageT | ModelMessageT | ToolCallT
export type HistoryT = MessageT[]

/* Workspace State */
export type StateT = {
  messages: MessageT[]
  queries: {
    title: string,
    source: string,
    abstract: string | null,
    authors: string[],
    link: string | null
  }[]
}


export type Workspace = {
  //use for createWorkSpace() and getWorkSpace()
  name: string;
  uuid: string;
  chat_history: StateT;
  last_modified: string;
  create_date: string;
};
/*
export async function createWorkspace(payload: {
  name?: string;
  user_prompt: string;
}): Promise<Workspace> {
  const response = await axiosInstance.post<Workspace>(
    `/workspace.create`,
    payload
  );
  return response.data;
}*/


export async function getWorkspace(uuid: string): Promise<Workspace> {
  const response = await axiosInstance.get<Workspace>(`/workspace/${uuid}`);
  return response.data;
}

export async function renameWorkspace(
  uuid: string,
  payload: { name: string }
): Promise<void> {
  await axiosInstance.post(`/workspace.rename/${uuid}`, payload);
}

export async function deleteWorkspace(uuid: string): Promise<void> {
  await axiosInstance.delete(`/workspace/${uuid}`);
}
/*
export async function streamChat(uuid payload handlers) {
  // needs to be implemented later ... 
}
*/
export type FileRow = { // use for fsList()
  name: string;
  summary: string;
  uuid: string;
}  

export async function fsList(): Promise<FileRow[]> {
  const response = await axiosInstance.get<FileRow[]>(`/fs.ls`);
  return response.data;
}

export async function fsTempUpload(
  name: string,
  file: File,
  summary?: string
): Promise<{uuid: string}> {
  const formData = new FormData();  
  formData.append("name",name);
  if (summary) formData.append("summary",summary);
  if (file) formData.append("file",file);
  const response = await axiosInstance.post<{uuid: string}>(
    `/fs.temp_upload`, 
    formData, 
    {
      headers: {
        "Content-Type": "multipart/form-data", // since we are sending files 
      },
    }
  );
  return response.data;
}

export type ConfirmedFile = {  //return for fsConfirmUpload
  name: string,
  summary: string,
  uuid: string,
  create_date: string,
  last_modified: string
}
export async function fsConfirmUpload(tempFileUuid:string, payload: {name: string, summary:string}): Promise<ConfirmedFile> {
  const response = await axiosInstance.post<ConfirmedFile>(`/fs.confirm_upload/${tempFileUuid}`, payload) 
  return response.data
}

export async function fsDownloadUrl(file_uuid:string): Promise<string> {
  const response = await axiosInstance.get<string>(`/fs.download_file/${file_uuid}`); 
  return response.data
}

export async function agentMakeTopic(workspaceUuid:string): Promise<string>{
  const response = await axiosInstance.get<string>(`/agent.topic_maker/${workspaceUuid}`);
  return response.data
}

export async function agentSummariseFile(tempFileUuid:string): Promise<string> {
  const response = await axiosInstance.get<string>(`/agent.summarise_file/${tempFileUuid}`); 
  return response.data
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
