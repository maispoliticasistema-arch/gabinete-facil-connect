import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { GabineteProvider } from "./contexts/GabineteContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RequiresGabinete } from "./components/RequiresGabinete";
import { MainLayout } from "./components/layout/MainLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import SetupGabinete from "./pages/SetupGabinete";
import Demandas from "./pages/Demandas";
import Eleitores from "./pages/Eleitores";
import Agenda from "./pages/Agenda";
import Mapa from "./pages/Mapa";
import Roteiros from "./pages/Roteiros";
import Configuracoes from "./pages/Configuracoes";
import Relatorios from "./pages/Relatorios";
import MinhaConta from "./pages/MinhaConta";
import NotFound from "./pages/NotFound";
import Inicio from "./pages/Inicio";
import CadastroPublico from "./pages/CadastroPublico";
import ConstrutorDeSites from "./pages/ConstrutorDeSites";
import PortalPublico from "./pages/PortalPublico";

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
              <Route path="/inicio" element={<Inicio />} />
              <Route path="/cadastro-publico" element={<CadastroPublico />} />
              <Route path="/portal/:slug" element={<PortalPublico />} />
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
                    <RequiresGabinete>
                      <MainLayout>
                        <Index />
                      </MainLayout>
                    </RequiresGabinete>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/demandas"
                element={
                  <ProtectedRoute>
                    <RequiresGabinete>
                      <MainLayout>
                        <Demandas />
                      </MainLayout>
                    </RequiresGabinete>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/eleitores"
                element={
                  <ProtectedRoute>
                    <RequiresGabinete>
                      <MainLayout>
                        <Eleitores />
                      </MainLayout>
                    </RequiresGabinete>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/agenda"
                element={
                  <ProtectedRoute>
                    <RequiresGabinete>
                      <MainLayout>
                        <Agenda />
                      </MainLayout>
                    </RequiresGabinete>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mapa"
                element={
                  <ProtectedRoute>
                    <RequiresGabinete>
                      <MainLayout>
                        <Mapa />
                      </MainLayout>
                    </RequiresGabinete>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/roteiros"
                element={
                  <ProtectedRoute>
                    <RequiresGabinete>
                      <MainLayout>
                        <Roteiros />
                      </MainLayout>
                    </RequiresGabinete>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/relatorios"
                element={
                  <ProtectedRoute>
                    <RequiresGabinete>
                      <MainLayout>
                        <Relatorios />
                      </MainLayout>
                    </RequiresGabinete>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/configuracoes"
                element={
                  <ProtectedRoute>
                    <RequiresGabinete>
                      <MainLayout>
                        <Configuracoes />
                      </MainLayout>
                    </RequiresGabinete>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/minha-conta"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <MinhaConta />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/construtor-de-sites"
                element={
                  <ProtectedRoute>
                    <RequiresGabinete>
                      <MainLayout>
                        <ConstrutorDeSites />
                      </MainLayout>
                    </RequiresGabinete>
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
