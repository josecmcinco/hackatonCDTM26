import { ReactNode } from "react";
import { Topbar } from "./Topbar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Topbar />

      <main className="flex-1 px-6 md:px-12 py-10 max-w-[1200px] w-full mx-auto space-y-12">
        {children}
      </main>

      <footer className="py-6 px-12 border-t border-border/40 text-center text-xs text-muted-foreground">
        <span>Powered by NTT DATA · AI Talent Matcher</span>
      </footer>
    </div>
  );
}
