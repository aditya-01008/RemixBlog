import { useFetcher, useLocation, useParams } from "@remix-run/react";
import { useEffect } from "react";
import { Button } from "~/components/ui/button";
import { useToast } from "~/components/ui/use-toast";
import { cn } from "~/lib/utils";
import { loader as followLoader } from "~/routes/api.follow";
import { useUser } from "~/utils/general";

type Props = {
    userId: string;
    variant?: "default" | "link";
    sm?: boolean;
};
const FollowButton = ({ userId, variant = "link", sm }: Props) => {
    const user = useUser();
    const { toast } = useToast();
    const location = useLocation();
    const loader = useFetcher<typeof followLoader>();
    const fetcher = useFetcher<any>();
    useEffect(() => {
        if (!loader.data && user) loader.load(`/api/follow?userId=${userId}`);
    }, []);
    useEffect(() => {
        if (
            fetcher.data &&
            fetcher.data !== "followed" &&
            fetcher.data !== "unfollowed"
        ) {
            toast({ description: fetcher.data, variant: "destructive" });
        }
    }, [fetcher.data]);
    const isFollowing = loader.data?.isFollowing ?? false;
    const handleSubmit = (e: any) => {
        e.preventDefault();
        fetcher.submit(
            {
                userId,
                isFollowing,
                redirect: location.pathname,
            },
            {
                encType: "application/json",
                method: loader.data?.isFollowing ? "DELETE" : "POST",
                action: "/api/follow",
            }
        );
    };

    return (
        <fetcher.Form
            onSubmit={handleSubmit}
            // method={loader.data?.isFollowing ? "DELETE" : "POST"}
            // action="/api/follow"
        >
            <Button
                type="submit"
                disabled={loader.state !== "idle" || fetcher.state !== "idle"}
                variant={variant}
                size={sm ? "sm" : "default"}
                className={cn(
                    variant === "default"
                        ? cn(
                              user?._id === userId ? "hidden" : "",
                              loader.data?.isFollowing
                                  ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                                  : "bg-green-600 text-white hover:bg-green-700",
                              "w-full max-w-xs place-self-center"
                          )
                        : !loader.data?.isFollowing
                        ? "text-green-500 hover:text-green-600"
                        : "text-accent-foreground"
                )}
            >
                {loader.data?.isFollowing ? "Unfollow" : "Follow"}
            </Button>
        </fetcher.Form>
    );
};
export default FollowButton;
