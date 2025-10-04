import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { GabineteProvider } from "./contexts/GabineteContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { MainLayout } from "./components/layout/MainLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import SetupGabinete from "./pages/SetupGabinete";
import Demandas from "./pages/Demandas";
import Eleitores from "./pages/Eleitores";
import Agenda from "./pages/Agenda";
import Mapa from "./pages/Mapa";
import Roteiros from "./pages/Roteiros";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <GabineteProvider>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/setup-gabinete"
                element={
                  <ProtectedRoute>
                    <SetupGabinete />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Index />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/demandas"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Demandas />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/eleitores"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Eleitores />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/agenda"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Agenda />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mapa"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Mapa />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/roteiros"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Roteiros />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </GabineteProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
