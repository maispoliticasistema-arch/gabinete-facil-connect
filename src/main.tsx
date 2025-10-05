import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { trackPageLoad, startInfrastructureMetricsCollection } from "@/lib/performanceMonitor";

// Iniciar monitoramento de performance de página
trackPageLoad();

// Iniciar coleta de métricas de infraestrutura
startInfrastructureMetricsCollection();

createRoot(document.getElementById("root")!).render(<App />);
