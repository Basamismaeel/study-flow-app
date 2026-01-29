import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthGate } from "@/components/AuthGate";
import { TimerProvider } from "@/contexts/TimerContext";
import { LoginPage } from "@/pages/LoginPage";
import { MajorSelectionPage } from "@/pages/MajorSelectionPage";
import { ProtectedLayout } from "@/components/ProtectedLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <AuthGate>
          <TimerProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/select-major" element={<MajorSelectionPage />} />
                <Route path="*" element={<ProtectedLayout />} />
              </Routes>
            </BrowserRouter>
          </TimerProvider>
        </AuthGate>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
