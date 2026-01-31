import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthGate } from "@/components/AuthGate";
import { TimerProvider } from "@/contexts/TimerContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoginPage } from "@/pages/LoginPage";
import { MajorSelectionPage } from "@/pages/MajorSelectionPage";
import { PendingApprovalPage } from "@/pages/PendingApprovalPage";
import { BlockedAccessPage } from "@/pages/BlockedAccessPage";
import { AdminApprovalPage } from "@/pages/AdminApprovalPage";
import { ProtectedLayout } from "@/components/ProtectedLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ErrorBoundary
        fallback={
          <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 bg-background">
            <h1 className="text-xl font-semibold text-destructive">Something went wrong</h1>
            <p className="text-muted-foreground text-center max-w-md">
              Try refreshing the page. If the problem continues, sign out and sign in again.
            </p>
            <a href="/" className="text-primary hover:underline">Go to home</a>
          </div>
        }
      >
        <AuthProvider>
          <AuthGate>
            <TimerProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/pending" element={<PendingApprovalPage />} />
                  <Route path="/blocked" element={<BlockedAccessPage />} />
                  <Route path="/admin" element={<AdminApprovalPage />} />
                  <Route path="/select-major" element={<MajorSelectionPage />} />
                  <Route path="*" element={<ProtectedLayout />} />
                </Routes>
              </BrowserRouter>
            </TimerProvider>
          </AuthGate>
        </AuthProvider>
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
