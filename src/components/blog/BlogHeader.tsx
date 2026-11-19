import { BlogPost } from "@/lib/blog/types";
import { TagBadge } from "./TagBadge";
import { Calendar, Clock } from "lucide-react";

interface BlogHeaderProps {
  post: BlogPost;
}

// Simple date formatter without external library
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    // Fecha de calendario, no instante: sin UTC, en UTC-5 cae al día anterior.
    timeZone: "UTC",
  };
  return date.toLocaleDateString("en-US", options);
}

export function BlogHeader({ post }: BlogHeaderProps) {
  return (
    <header className="mb-8">
      <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
        {post.title}
      </h1>

      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-4">
        <div className="flex items-center gap-2">
          <Calendar size={16} />
          <time dateTime={post.date}>{formatDate(post.date)}</time>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={16} />
          <span>{post.readingTime} min read</span>
        </div>
        <span>By {post.author}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {post.tags.map((tag) => (
          <TagBadge key={tag} tag={tag} />
        ))}
      </div>

      <p className="text-xl text-gray-300 mt-6 glass p-4 rounded-lg">
        {post.excerpt}
      </p>
    </header>
  );
}
