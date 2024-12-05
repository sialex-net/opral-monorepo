import { useAtom } from "jotai/react";
import timeAgo from "@/helper/timeAgo.ts";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar.tsx";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip.tsx";
import { activeDiscussionAtom } from "@/state-active-file.ts";

const DiscussionThread = () => {
  const [activeDiscussion] = useAtom(activeDiscussionAtom);

  return (
    <div>
      {activeDiscussion?.comments &&
        JSON.parse(activeDiscussion?.comments)
          .map((comment: {
            id: string;
            created_by: string;
            created_at: string;
            content: string;
          }) => (
            <div key={comment.id} className="flex items-start gap-3 mb-6 overflow-y-auto pl-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Avatar className="w-8 h-8 cursor-pointer hover:opacity-90 transition-opacity">
                      <AvatarImage src="#" alt="#" />
                      <AvatarFallback className="bg-[#fff] text-[#141A21] border border-[#DBDFE7]">
                        {comment.created_by ? comment.created_by.substring(0, 2).toUpperCase() : "XX"}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>{comment.created_by}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div>
                <div className="flex flex-1 gap-3 py-1 mb-1.5">
                  <span className="font-medium">{comment.created_by}</span>
                  <span className="text-slate-500">{timeAgo(comment.created_at)}</span>
                </div>
                <p>{comment.content}</p>
              </div>
            </div>
          ))}
    </div>
  )
}

export default DiscussionThread