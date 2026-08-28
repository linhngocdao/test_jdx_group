import { HrNav } from "./hr-nav";

export default function HrLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-1 flex-col bg-muted/30">
      <HrNav />
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
