import { Spinner } from "@/components/ui/Spinner";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center text-accent">
      <Spinner className="h-8 w-8" />
    </div>
  );
}
