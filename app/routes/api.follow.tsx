import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import { ShouldRevalidateFunction } from "@remix-run/react";
import invariant from "tiny-invariant";
import { authenticator } from "~/auth.server";
import { connect } from "~/db.server";
import { follow, isFollowing, unfollow } from "~/models/follow.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
    const user = await authenticator.isAuthenticated(request, {
        failureRedirect: `/login?redirectTo=/blogs`,
    });
    const userId = new URL(request.url).searchParams.get("userId");
    invariant(userId);

    await connect();

    return { isFollowing: await isFollowing(user._id, userId) };
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
    const { _id } = await authenticator.isAuthenticated(request, {
        failureRedirect: `/login?redirectTo=/blogs/${params.blogId ?? ""}`,
    });
    const { userId, blogId, isFollowing } = await request.json();
    invariant(blogId);
    invariant(userId);
    if (isFollowing !== false && typeof isFollowing === "string") {
        const time = parseInt(isFollowing.split("T").pop() ?? "");
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        if (fiveMinutesAgo < time)
            return json("Too many requests", { status: 429 });
    }
    await connect();
    if (request.method === "POST") {
        return await follow(_id, userId);
    } else if (request.method === "DELETE") {
        return await unfollow(_id, userId);
    }
    return {};
};
export const shouldRevalidate: ShouldRevalidateFunction = ({
    defaultShouldRevalidate,
    formAction,
}) => {
    // if (formAction?.split("/").pop() === "comments") return false;
    if (formAction !== "/api/follow") return false;
    return defaultShouldRevalidate;
};
