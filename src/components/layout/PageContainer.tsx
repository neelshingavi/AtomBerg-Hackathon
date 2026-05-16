export function PageContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`p-4 sm:p-6 max-w-7xl mx-auto w-full ${className ?? ""}`}>{children}</div>
  );
}
