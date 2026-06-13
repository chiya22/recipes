import type { Tag } from "@/types";

export function TagChips({ tags }: { tags: Tag[] }) {
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((tag) => (
        <span
          key={tag.id}
          className="inline-flex items-center rounded-full border border-border bg-background px-2 py-0.5 text-xs text-foreground/80"
        >
          {tag.name}
        </span>
      ))}
    </div>
  );
}
