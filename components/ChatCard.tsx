import { MessageT } from "@/app/api/wrappers";
import { Card } from "@heroui/card";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faRobot, faUser } from "@fortawesome/free-solid-svg-icons";
import { Spinner } from "@heroui/spinner";

type CardProps = {
  m: MessageT;
  isLoading: boolean;
  showAvatar?:boolean
};
const roleLabel = (role: "user" | "ai" | "tool_call") =>
  role === "user" ? "You" : role === "ai" ? "Assistant" : "System";

export default function ChatCard({ m, isLoading, showAvatar = true }: CardProps) {
  // const cls =
  //   m.type === "user"
  //     ? "bg-content2"
  //     : m.type === "ai"
  //       ? "bg-content1"
  //       : "bg-default-50 border border-dashed";
  if (m.type === "user") {
    return (
      <div className="flex flex-col gap-y-2">
        <div className="flex flex-row gap-x-4 items-center aria-hidden:hidden" aria-hidden = {!showAvatar}>
          <div className="w-8 h-8 bg-sky-400 flex flex-col items-center justify-center rounded-full">
            <FontAwesomeIcon
              icon={faUser}
              className="rounded-full text-white"
            />
          </div>
          <p>User</p>
        </div>
        <Card className="px-3 py-2 bg-sky-100" shadow="none" radius="sm">
          {m.content}
        </Card>
      </div>
    );
  } else if (m.type === "ai") {
    return (
      <div className="flex flex-col gap-y-2">
        <div className="flex flex-row gap-x-4 items-center aria-hidden:hidden" aria-hidden={!showAvatar}>
          <div className="w-8 h-8 bg-emerald-200 flex flex-col items-center justify-center rounded-full">
            <FontAwesomeIcon
              icon={faRobot}
              className="rounded-full text-white"
            />
          </div>
          <p>Bro</p>
        </div>
        <Card className="px-3 py-2 bg-emerald-50" shadow="none" radius="sm">
          {m.content}
        </Card>
      </div>
    );
  } else {
    return (
      <div className="flex flex-col gap-y-2 ">
          <div className="flex flex-row gap-x-4 items-center aria-hidden:hidden" aria-hidden={!showAvatar}>
          <div className="w-8 h-8 bg-emerald-200 flex flex-col items-center justify-center rounded-full">
            <FontAwesomeIcon
              icon={faRobot}
              className="rounded-full text-white"
            />
          </div>
          <p>Bro</p>
        </div>
       <div className = "flex flex-row gap-x-2">
         <Spinner aria-hidden={m.is_complete} className="aria-hidden:hidden" size="sm"/>
        <div className="aria-hidden:hidden w-6 h-6 text-white bg-green-200 flex flex-col items-center justify-center rounded-full" aria-hidden={!m.is_complete}>
          <FontAwesomeIcon icon={faCheck} />
        </div>
        <p>{m.tool_name}</p>
       </div>
      </div>
    );
  }
  // return (
  //   <Card className={`px-3 py-2 ${cls}`} shadow="none" radius="sm">
  //     <div className="text-xs mb-1 font-medium text-default-500">
  //       {roleLabel(m.type)}
  //     </div>

  //     {m.type === "ai" ? (
  //       // LLM 응답에만 Markdown 적용
  //       <div className="prose prose-sm max-w-none prose-pre:overflow-x-auto">
  //         <ReactMarkdown
  //           remarkPlugins={[remarkGfm]}
  //           rehypePlugins={[rehypeHighlight]}
  //         >
  //           {m.content}
  //         </ReactMarkdown>
  //         <p>{isLoading && "adfasdfasdfas"}</p>
  //       </div>
  //     ) : (
  //       // 사용자/시스템 메시지는 평문 유지
  //       <div className="whitespace-pre-wrap text-sm">
  //         {m.type === "user" && m.content}
  //       </div>
  //     )}
  //   </Card>
  // );
}
