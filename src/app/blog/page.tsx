import { Metadata } from "next";
import { getAllPosts } from "@/lib/blog/posts";
import { BlogList } from "@/components/blog/BlogList";

export const metadata: Metadata = {
	title: "Blog | William Salas",
	description:
		"Technical articles about React, Next.js, TypeScript, and modern web development by William Salas.",
	keywords: [
		"William Salas",
		"blog",
		"React",
		"Next.js",
		"TypeScript",
		"Web Development",
		"Full Stack Development",
		"Frontend",
		"Backend",
	],
	openGraph: {
		title: "Blog | William Salas",
		description:
			"Technical articles about React, Next.js, TypeScript, and modern web development by William Salas.",
		url: "https://www.wsalas.com/blog",
		siteName: "William Salas Portfolio",
		type: "website",
	},
};

export const dynamic = "force-dynamic";

export default async function BlogPage() {
	const posts = await getAllPosts();

	return (
		<div className="min-h-screen py-12 px-4 md:px-8 lg:px-16">
			<div className="max-w-7xl mx-auto">
				<header className="mb-12">
					<h1 className="font-display text-4xl md:text-5xl font-bold mb-4">Blog</h1>
					<p className="text-xl text-gray-300">
						Thoughts, tutorials, and discoveries from my development journey.
					</p>
				</header>

				<BlogList posts={posts} />
			</div>
		</div>
	);
}
