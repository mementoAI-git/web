import Spinner from "@/components/spinner";

export function AuthLoader({ title }: { title: string }) {
  return (
    <div className="mx-auto flex min-h-100 w-full max-w-[554px] flex-col items-center justify-center gap-10 rounded-xl bg-white p-10">
      <Spinner loading className="!size-20 !text-secondary" />
      <span className="text-center text-2xl">{title}</span>
    </div>
  );
}


