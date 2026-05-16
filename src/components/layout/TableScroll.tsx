import { cn } from "@/lib/utils";

export function TableScroll({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("w-full overflow-x-auto -mx-1 px-1", className)}>{children}</div>
  );
}
