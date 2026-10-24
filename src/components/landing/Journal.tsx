import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/SectionHeading";
import { BlogCard } from "@/components/blog/BlogCard";
import { getAllPosts } from "@/lib/blog/posts";
import type { LandingCopy } from "@/lib/i18n";

/**
 * Los dos últimos posts. Si no hay ninguno, la sección no existe: una sección
 * vacía con un "coming soon" es peor que su ausencia.
 */
async function Journal({ copy }: { copy: LandingCopy }) {
	const posts = (await getAllPosts()).slice(0, 2);
	if (posts.length === 0) return null;

	return (
		<section className="py-20 md:py-32">
			<div className="container-page">
				<SectionHeading
					eyebrow={copy.journalSection.eyebrow}
					title={copy.journalSection.title}
					description={copy.journalSection.description}
				/>

				<div className="grid gap-6 md:grid-cols-2">
					{posts.map((post) => (
						<BlogCard key={post.slug} post={post} labels={copy.blogCard} />
					))}
				</div>

				<Link
					href="/blog"
					className="focus-ring group mt-8 inline-flex items-center gap-2 text-sm font-medium text-palette-lime hover:underline"
				>
					{copy.journalSection.allArticles}
					<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
				</Link>
			</div>
		</section>
	);
}

export default Journal;
