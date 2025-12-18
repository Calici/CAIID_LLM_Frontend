import { MessageT } from "@/app/api/wrappers";
import { Card } from "@heroui/card";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faRobot,
  faUser,
  faChevronRight,
  faChevronDown,
  faExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { Spinner } from "@heroui/spinner";
import Markdown from "react-markdown";
import { useState } from "react";
type CardProps = {
  m: MessageT;
  isLoading: boolean;
  showAvatar?: boolean;
};
// const roleLabel = (role: "user" | "ai" | "tool_call" | "error") =>
//   role === "user" ? "You" : role === "ai" ? "Assistant" : role === "error" ? "Error" : "System";

export default function ChatCard({
  m,
  isLoading,
  showAvatar = true,
}: CardProps) {
  // Toggle state for Error detailed messages
  const [showErrorDetail, setShowErrorDetail] = useState(false);

  if (m.type === "user") {
    return (
      <div className="flex flex-col gap-y-2">
        <div
          className="flex flex-row gap-x-4 items-center aria-hidden:hidden"
          aria-hidden={!showAvatar}
        >
          <div className="w-8 h-8 bg-primary-500 flex flex-col items-center justify-center rounded-full">
            <FontAwesomeIcon
              icon={faUser}
              className="rounded-full text-white"
            />
          </div>
          <p>User</p>
        </div>
        <Card
          className="px-3 py-2 bg-content1 text-foreground"
          shadow="none"
          radius="sm"
        >
          {m.content}
        </Card>
      </div>
    );
  } else if (m.type === "ai") {
    // check variabels for Error / ErrorDetails
    // const isError = (m as any).is_error;
    // const errorDetail = (m as any).error_detail as string | undefined;
    // const hasDetail = isError && !!errorDetail;
    return (
      <div className="flex flex-col gap-y-2">
        <div
          className="flex flex-row gap-x-4 items-center aria-hidden:hidden"
          aria-hidden={!showAvatar}
        >
          <div className="w-8 h-8 bg-secondary-500 flex flex-col items-center justify-center rounded-full">
            <FontAwesomeIcon
              icon={faRobot}
              className="rounded-full text-white"
            />
          </div>
          <p>Yuna</p>
        </div>
        <Card
          className="px-3 py-2 bg-content2 text-foreground"
          shadow="none"
          radius="sm"
        >
          <Markdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
          >
            {m.content}
          </Markdown>
        </Card>
      </div>
    );
  } else if (m.type === "error") {
    const errorDetail = m.detail;
    const hasDetail = !!errorDetail;

    return (
      <div className="flex flex-col gap-y-2">
        <div
          className="flex flex-row gap-x-4 items-center aria-hidden:hidden"
          aria-hidden={!showAvatar}
        >
          <div className="w-8 h-8 bg-secondary-500 flex flex-col items-center justify-center rounded-full">
            <FontAwesomeIcon
              icon={faRobot}
              className="rounded-full text-white"
            />
          </div>
          <p>Yuna</p>
        </div>

        <div className="flex flex-row gap-x-3">
          <div className="mt-1 flex-shrink-0">
            <div className="w-6 h-6 bg-warning-300 text-black flex items-center justify-center rounded-full">
              <FontAwesomeIcon icon={faExclamation} />
            </div>
          </div>

          <Card
            className="px-3 py-2 bg-content2 text-foreground border border-danger-400"
            shadow="none"
            radius="sm"
          >
            <div className="flex items-start gap-x-2">
              {hasDetail && (
                <button
                  type="button"
                  className="mt-1 flex-shrink-0"
                  onClick={() => setShowErrorDetail((prev) => !prev)}
                  aria-label={
                    showErrorDetail ? "에러 상세 접기" : "에러 상세 펼치기"
                  }
                >
                  <FontAwesomeIcon
                    icon={showErrorDetail ? faChevronDown : faChevronRight}
                    className="text-default-500 text-xs"
                  />
                </button>
              )}

              <div className="flex-1">
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                >
                  {m.content}
                </Markdown>

                {hasDetail && showErrorDetail && (
                  <div className="mt-2 rounded-md bg-content1/80 text-xs text-default-500 p-2">
                    <pre className="whitespace-pre-wrap break-all">
                      {errorDetail}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  } else { // tool_call
    return (
      <div className="flex flex-col gap-y-2 ">
        <div
          className="flex flex-row gap-x-4 items-center aria-hidden:hidden"
          aria-hidden={!showAvatar}
        >
          <div className="w-8 h-8 bg-secondary-500 flex flex-col items-center justify-center rounded-full">
            <FontAwesomeIcon
              icon={faRobot}
              className="rounded-full text-white"
            />
          </div>
          <p>Yuna</p>
        </div>
        {/* <div className="flex flex-row gap-x-2">
          <Spinner
            aria-hidden={m.is_complete}
            className="aria-hidden:hidden"
            size="sm"
          />
          <div
            className="aria-hidden:hidden w-6 h-6 text-white bg-success-400 flex flex-col items-center justify-center rounded-full"
            aria-hidden={!m.is_complete}
          >
            <FontAwesomeIcon icon={faCheck} />
          </div>
          <p>{m.tool_name}</p>
        </div> Uncomment it for tool_call spinner and check icons */} 
      </div>
    );
  }
}
