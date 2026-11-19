import Link from "next/link";
import { BlogPost } from "@/lib/blog/types";
import { TagBadge } from "./TagBadge";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { en } from "@/lib/i18n/en";
import type { LandingCopy } from "@/lib/i18n/types";

interface BlogCardProps {
  post: BlogPost;
  className?: string;
  // La página `/blog` sigue en inglés y no pasa nada: el default es `en`. La
  // landing traduce, así que `Journal` sí le pasa las etiquetas.
  labels?: LandingCopy["blogCard"];
}

// Simple date formatter without external library
function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    // "2026-10-03" es medianoche UTC; sin fijar la zona, en UTC-5 se muestra
    // como 2 de octubre.
    timeZone: "UTC",
  };
  return date.toLocaleDateString("en-US", options);
}

export function BlogCard({ post, className, labels = en.blogCard }: BlogCardProps) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn("block", className)}
    >
      <article
        className="glass flex flex-col justify-between h-[360px] p-6 rounded-lg transition-all duration-200 hover:glass-strong hover:scale-[1.02] group"
			>
				<div className="flex flex-col gap-2">

        <h2 className="font-display text-2xl font-bold text-white">
          {post.title}
        </h2>

        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-4">
          <div className="flex items-center gap-1">
            <Calendar size={14} />
            <time dateTime={post.date}>{formatDateShort(post.date)}</time>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>
              {post.readingTime} {labels.minutesSuffix}
            </span>
          </div>
        </div>
				</div>

				<p className="text-gray-300 mb-4 line-clamp-3">{post.excerpt}</p>

				<div className="flex flex-col gap-3">


				<div className="flex flex-wrap gap-2">
          {post.tags.slice(0, 3).map((tag) => (
            <TagBadge key={tag} tag={tag} />
          ))}
          {post.tags.length > 3 && (
            <span className="text-xs text-gray-500">
              +{post.tags.length - 3} {labels.moreSuffix}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-palette-lime group-hover:text-palette-lime transition-colors">
          <span className="font-medium">{labels.readMore}</span>
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </div>
				</div>
      </article>
    </Link>
  );
}
