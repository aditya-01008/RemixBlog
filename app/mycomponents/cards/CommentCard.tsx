import { AvatarIcon, DotsVerticalIcon } from "@radix-ui/react-icons";
import {
    FetcherWithComponents,
    useFetcher,
    useSearchParams,
} from "@remix-run/react";
import React, { useEffect, useRef } from "react";
import { CommentDoc } from "../BlogCommentsSheet";
import { formatTime, useUser } from "~/utils/general";
import { Button } from "~/components/ui/button";
import { FaRegThumbsUp } from "react-icons/fa";
import ReplyToComment from "../ReplyToComment";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { cn } from "~/lib/utils";

type Props = {
    comment: CommentDoc;
    updateReplies?: () => void;
};

const CommentCard = ({ comment, updateReplies }: Props) => {
    const fetcher = useFetcher<any>();
    const user = useUser();
    const divref = useRef<HTMLDivElement>(null);
    const commentHighlight =
        useSearchParams()[0].get("comment") === comment._id.toString();
    useEffect(() => {
        if (
            fetcher.data?.message === "deleted" ||
            fetcher.data?.message === "liked"
        ) {
            updateReplies && updateReplies();
        }
    }, [fetcher.data]);

    useEffect(() => {
        if (commentHighlight) {
            divref.current?.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
                inline: "nearest",
            });
        }
    }, [commentHighlight]);

    return (
        <div
            ref={divref}
            className={cn(
                "p-1 border border-border rounded-md",
                commentHighlight ? "bg-secondary" : ""
            )}
        >
            <div className="flex flex-row items-center gap-4">
                <AvatarIcon className="h-8 w-8" />
                <div className="flex flex-col">
                    <p className="text-sm">
                        {comment.user.username}
                        {comment.user.username === user?.username && " (You)"}
                    </p>
                    <small className="text-muted-foreground">
                        {formatTime(comment.createdAt.toString())}
                    </small>
                </div>
                {comment.user.username === user?.username && (
                    <DeleteButton
                        commentId={comment._id.toString()}
                        fetcher={fetcher}
                    />
                )}
            </div>
            <p className="line-clamp-3">{comment.content}</p>
            <div className="flex justify-between items-start relative">
                <LikeButton
                    commentId={comment._id.toString()}
                    liked={comment.liked}
                    fetcher={fetcher}
                    likes={comment.likes}
                />
                <ReplyToComment
                    isOwner={user?.username === comment.user.username}
                    commentId={comment._id.toString()}
                />
            </div>
        </div>
    );
};

function LikeButton({
    likes,
    liked,
    commentId,
    fetcher,
}: {
    likes: number;
    liked: boolean;
    commentId: string;
    fetcher: FetcherWithComponents<any>;
}) {
    if (fetcher.formData?.get("_action") === "likeComment") {
        likes = likes + (liked ? -1 : 1);
        liked = !liked;
    }

    return (
        <form
            className="absolute top-2 left-0"
            onSubmit={(e) => {
                e.preventDefault();
                fetcher.submit(
                    { _action: "likeComment", commentId },
                    { action: "comments", method: "POST" }
                );
            }}
        >
            <input type="hidden" name="_action" value="likeComment" />
            <input type="hidden" name="commentId" value={commentId} />

            <Button
                type="submit"
                size="sm"
                className="flex gap-2"
                variant="ghost"
            >
                <FaRegThumbsUp className={liked ? "text-blue-600" : ""} />
                {likes}
            </Button>
        </form>
    );
}
function DeleteButton({
    commentId,
    fetcher,
}: {
    commentId: string;
    fetcher: FetcherWithComponents<any>;
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="ml-auto mr-2">
                <DotsVerticalIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuLabel>Comment Menu</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Button
                        disabled={fetcher.state !== "idle"}
                        onClick={() =>
                            fetcher.submit(
                                { _action: "deleteComment", commentId },
                                { method: "POST", action: "comments" }
                            )
                        }
                        size="sm"
                        variant="destructive"
                        className="hover:cursor-pointer"
                    >
                        Delete Comment
                    </Button>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default CommentCard;
