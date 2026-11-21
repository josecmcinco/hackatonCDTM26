import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AppProvider } from "@/providers/AppContext";
import { AppShell } from "@/components/layout/AppShell";
import { HomeScreen } from "@/features/home/HomeScreen";
import { OpportunitiesScreen } from "@/features/opportunities/OpportunitiesScreen";
import { MatchResultsScreen } from "@/features/match/MatchResultsScreen";
import { CompareScreen } from "@/features/compare/CompareScreen";
import { Toaster } from "@/components/ui/sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatePresence, motion } from "motion/react";

// Lazy-loaded heavy visualization routes per requirement
const SkillsScreen = lazy(() => import("@/features/skills/SkillsScreen"));
const GuardrailsScreen = lazy(() => import("@/features/guardrails/GuardrailsScreen"));

function PageSuspenseFallback() {
  return (
    <div className="space-y-6 animate-pulse py-8">
      <Skeleton className="h-10 w-72" />
      <Skeleton className="h-6 w-96" />
      <Skeleton className="h-[460px] w-full rounded-[16px]" />
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        <Routes location={location}>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/oportunidades" element={<OpportunitiesScreen />} />
          <Route path="/oportunidades/:id" element={<MatchResultsScreen />} />
          <Route
            path="/skills"
            element={
              <Suspense fallback={<PageSuspenseFallback />}>
                <SkillsScreen />
              </Suspense>
            }
          />
          <Route path="/comparar" element={<CompareScreen />} />
          <Route
            path="/guardarrailes"
            element={
              <Suspense fallback={<PageSuspenseFallback />}>
                <GuardrailsScreen />
              </Suspense>
            }
          />
          {/* Fallback to home */}
          <Route path="*" element={<HomeScreen />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <AppProvider>
        <BrowserRouter>
          <AppShell>
            <AnimatedRoutes />
          </AppShell>
          <Toaster position="top-right" />
        </BrowserRouter>
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
