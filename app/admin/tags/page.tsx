import { TagManager } from "@/components/admin/TagManager";
import { listTagsWithCount } from "@/lib/tags";

export default async function AdminTagsPage() {
  const tags = await listTagsWithCount();
  return <TagManager tags={tags} />;
}
