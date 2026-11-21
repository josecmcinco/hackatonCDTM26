import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AppProvider } from "@/providers/AppContext";
import { AppShell } from "@/components/layout/AppShell";
import { ProjectMatcherPage } from "@/features/matcher/ProjectMatcherPage";
import { Toaster } from "@/components/ui/sonner";

export function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <AppProvider>
        <BrowserRouter>
          <AppShell>
            <Routes>
              <Route path="/" element={<ProjectMatcherPage />} />
              <Route path="*" element={<ProjectMatcherPage />} />
            </Routes>
          </AppShell>
          <Toaster position="top-right" />
        </BrowserRouter>
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
