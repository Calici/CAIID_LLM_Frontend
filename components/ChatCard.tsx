import { MessageT } from "@/app/api/wrappers";
import { Card } from "@heroui/card";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faRobot, faUser } from "@fortawesome/free-solid-svg-icons";
import { Spinner } from "@heroui/spinner";
import Markdown from "react-markdown";

type CardProps = {
  m: MessageT;
  isLoading: boolean;
  showAvatar?: boolean;
};
const roleLabel = (role: "user" | "ai" | "tool_call") =>
  role === "user" ? "You" : role === "ai" ? "Assistant" : "System";

export default function ChatCard({
  m,
  isLoading,
  showAvatar = true,
}: CardProps) {
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
        <Card className="px-3 py-2 bg-primary-100" shadow="none" radius="sm">
          {m.content}
        </Card>
      </div>
    );
  } else if (m.type === "ai") {
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
        <Card className="px-3 py-2 bg-secondary-100" shadow="none" radius="sm">
          <Markdown>{m.content}</Markdown>
        </Card>
      </div>
    );
  } else {
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
          <p>Bro</p>
        </div>
        <div className="flex flex-row gap-x-2">
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
        </div>
      </div>
    );
  }
}
