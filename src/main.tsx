import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { trackPageLoad } from "@/lib/performanceMonitor";

// Iniciar monitoramento de performance de página
trackPageLoad();

createRoot(document.getElementById("root")!).render(<App />);
