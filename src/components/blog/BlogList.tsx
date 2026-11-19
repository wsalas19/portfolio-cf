import { BlogPost } from "@/lib/blog/types";
import { BlogCard } from "./BlogCard";

interface BlogListProps {
	posts: BlogPost[];
}

export function BlogList({ posts }: BlogListProps) {
	if (posts.length === 0) {
		return (
			<div className="text-center py-12">
				<p className="text-gray-400">No blog posts yet. Check back soon!</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{posts.map((post) => (
				<BlogCard key={post.slug} post={post} />
			))}
		</div>
	);
}
