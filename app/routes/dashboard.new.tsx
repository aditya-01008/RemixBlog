import { ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ZodError } from "zod";
import { authenticator } from "~/auth.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { connect } from "~/db.server";
import { NewBlogSchema } from "~/lib/zod";
import { Blogs, Content } from "~/models/Schema.server";
import ContentItem from "~/mycomponents/ContentItem";
import {
    destructiveToastStyle,
    parseNewBlog,
    parseZodBlogError,
} from "~/utils/general";

type Props = {};

export async function action({ request }: ActionFunctionArgs) {
    const user = await authenticator.isAuthenticated(request, {
        failureRedirect: "/login",
    });
    // console.log(user);
    const blog = await request.formData();
    const parsed = parseNewBlog(blog);

    try {
        const newBlog = NewBlogSchema.parse(parsed);
        await connect();
        const dbblog = await Blogs.create({ ...newBlog, author: user._id });
        // console.log(dbblog);
        return redirect(`/blogs/${dbblog._id.toString()}`, { status: 302 });
    } catch (error: any) {
        if (error instanceof ZodError) {
            return json(parseZodBlogError(error), { status: 400 });
        }
        return json(
            { error: { message: "Something went wrong" } },
            { status: 500 }
        );
    }
}

const CreateNewBlog = (props: Props) => {
    const [content, setContent] = useState([0]);
    const res = useActionData() as any;
    const loading = useNavigation().state === "submitting";
    useEffect(() => {
        if (res?.error?.message)
            toast.error(res?.error?.message, {
                style: destructiveToastStyle,
            });
    }, [res]);

    function addMore() {
        if (content.length >= 5) return;
        setContent((prev) => [...prev, 0]);
    }
    function deleteContent(index: number) {
        setContent((prev) => prev.filter((_, ind) => index !== ind));
        // setContent((prev) => {
        //     const newArr = [...prev];
        //     newArr.pop();
        //     return newArr;
        // });
    }
    return (
        <Form method="post" className="container max-w-3xl flex-1">
            {/* <ScrollArea> */}
            <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="title">
                        Title{" "}
                        <span className="text-red-500">
                            {res?.error?.title}
                        </span>
                    </Label>
                    <Input
                        id="title"
                        name="title"
                        type="text"
                        required
                        placeholder="Title of your blog"
                    />
                </div>
                <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="desc">
                        Description{" "}
                        <span className="text-red-500">{res?.error?.desc}</span>
                    </Label>
                    <Textarea
                        id="desc"
                        required
                        name="desc"
                        placeholder="Your desc"
                    />
                </div>
                <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="thumbnail">
                        Thumbnail{" "}
                        <span className="text-red-500">
                            {res?.error?.thumbnail}
                        </span>
                    </Label>
                    <Input
                        id="thumbnail"
                        required
                        name="thumbnail"
                        type="text"
                        placeholder="Link to your blog thumbnail"
                    />
                </div>
                <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="content1">Content</Label>
                    <div className="p-2 pl-6 md:pl-10">
                        {content.map((_, ind) => (
                            <ContentItem
                                key={ind}
                                index={ind}
                                deleteContent={deleteContent}
                                errors={
                                    res?.error?.content
                                        ? res.error.content[ind]
                                        : undefined
                                }
                            />
                        ))}
                        {content.length < 5 ? (
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                className="w-full"
                                onClick={addMore}
                            >
                                Add More
                            </Button>
                        ) : null}
                    </div>
                </div>
            </div>
            <Button type="submit" disabled={loading} className="mt-4">
                {loading ? "Uploading..." : "Upload"}
            </Button>
            {/* </ScrollArea> */}
        </Form>
    );
};

export default CreateNewBlog;
