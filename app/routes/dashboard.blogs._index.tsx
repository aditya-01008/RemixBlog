import { LoaderFunctionArgs } from "@remix-run/node";
import {
    ClientLoaderFunctionArgs,
    Link,
    useLoaderData,
} from "@remix-run/react";
import { authenticator } from "~/auth.server";
import { TypographyH1, TypographyP } from "~/components/Typography";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { connect } from "~/db.server";
import { BlogDocument, Blogs } from "~/models/Schema.server";
import DashboardBlogCard from "~/mycomponents/DashboardBlogCard";
import DashboardPagination from "~/mycomponents/DashboardPagination";
import { cacheDashboardBlogs } from "~/utils/localStorageCache.client";

type BlogDoc = Pick<BlogDocument, "_id" | "desc" | "title" | "updatedAt">;

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const user = await authenticator.isAuthenticated(request, {
        failureRedirect: "/login?redirectTo=/dashboard/blogs",
    });
    await connect();
    const blogs = (await Blogs.find(
        { author: user._id },
        {
            _id: 1,
            desc: 1,
            title: 1,
            updatedAt: 1,
        }
    )
        .sort({ updatedAt: -1 })
        .lean()) as BlogDoc[];
    console.log(blogs.length);
    return { blogs, totalBlogs: blogs.length };
};

export const clientLoader = ({
    request,
    serverLoader,
}: ClientLoaderFunctionArgs) =>
    cacheDashboardBlogs({
        request,
        serverLoader,
    });

clientLoader.hydrate = true;

export const HydrateFallback = () => {
    return (
        <div className="h-full flex flex-col items-center">
            <div className="w-[300px] sm:w-[400px] md:w-[500px] lg:w-[600px] overflow-auto ver_scroll flex-1 flex flex-col items-center gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div
                        key={i}
                        className="w-full border flex gap-4 p-6 rounded-lg"
                    >
                        <div className="flex flex-col items-start gap-3 flex-1">
                            <Skeleton className="w-full h-6" />
                            <Skeleton className="w-3/5 h-4" />
                        </div>
                        <div className="flex gap-3">
                            <Skeleton className="h-9 w-20 rounded-lg" />
                            <Skeleton className="h-9 w-20 rounded-lg" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const DashboardBlogs = () => {
    const { blogs, totalBlogs } = useLoaderData<{
        blogs: BlogDoc[];
        totalBlogs: number;
    }>();
    // console.log(totalBlogs);
    return (
        <div className="h-full flex flex-col items-center">
            <div className="w-[300px] sm:w-[400px] md:w-[500px] lg:w-[600px] overflow-auto ver_scroll flex-1 flex flex-col items-center gap-4">
                {blogs.map((blog, ind) => (
                    <DashboardBlogCard
                        key={blog._id?.toString()}
                        title={blog.title}
                        _id={blog._id.toString()}
                        desc={blog.desc}
                        updatedAt={blog.updatedAt}
                    />
                ))}
                {totalBlogs === 0 ? (
                    <div className="flex h-full gap-6 flex-col items-center justify-center">
                        <TypographyH1>No Blogs</TypographyH1>
                        <div className="text-muted-foreground flex flex-col items-center gap-1">
                            <TypographyP>Create a new one</TypographyP>
                            <Link to="/dashboard/new">
                                <Button>Create Now</Button>
                            </Link>
                        </div>
                    </div>
                ) : null}
            </div>
            {totalBlogs > 10 ? (
                <DashboardPagination totalBlogs={totalBlogs} />
            ) : null}
        </div>
    );
};

export default DashboardBlogs;
