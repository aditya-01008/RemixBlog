import { BlogDocument, Blogs } from "./Schema.server";
export interface BlogDocumentwPic extends Omit<BlogDocument, "author"> {
    author: { username: string; picture?: string };
}
type cacheType = {
    popularBlogs: BlogDocumentwPic[];
    trendingBlogs: BlogDocumentwPic[];
    latestBlogs: BlogDocumentwPic[];
};
const cache: cacheType = {
    popularBlogs: [],
    trendingBlogs: [], //combination of likes and comments in a giver time period
    latestBlogs: [],
};

async function getPopularBlogs() {
    return (await Blogs.find(
        {},
        {},
        { sort: { views: -1 }, limit: 10, lean: true }
    ).populate("author", { username: 1, picture: 1, _id: 0 })) as any;
}
async function getTrendingBlogs() {
    const oneMAgo = new Date();
    oneMAgo.setDate(oneMAgo.getDate() - 30);

    return (await Blogs.find(
        {
            createdAt: { $gte: oneMAgo },
        },
        {},
        { sort: { views: -1, likes: -1, comments: -1 }, limit: 10, lean: true }
    ).populate("author", { username: 1, picture: 1, _id: 0 })) as any;
}
async function getLatestBlogs() {
    return (await Blogs.find(
        {},
        {},
        { sort: { createdAt: -1 }, limit: 10, lean: true }
    ).populate("author", { username: 1, picture: 1, _id: 0 })) as any;
}

const updateCache = async () => {
    try {
        cache.popularBlogs = await getPopularBlogs();
        cache.trendingBlogs = await getTrendingBlogs();
        cache.latestBlogs = await getLatestBlogs();
        console.log("Cache updated at", new Date());
    } catch (err) {
        console.error("Error updating cache:", err);
    }
};

// Update the cache every hour (3600000 milliseconds)
setInterval(updateCache, 3600000);

// Initial cache population
updateCache();
export default cache;
// console.log(cache.latestBlogs);
