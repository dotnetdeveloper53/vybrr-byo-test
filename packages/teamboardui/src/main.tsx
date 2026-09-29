import { FrontendErrorBoundary, initFrontendLogs } from "@vybrr/vybrr-frontend-logs";
import { initInspector } from "@vybrr/vybrr-inspector";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { App } from "./App.js";
// tenant-app-theming-design.md §2.1: theme.css (platform-managed tokens) must load first.
import "./theme.css";
import "./styles.css";
import { AuthProvider } from "@vybrr/auth-framework-react";

// tenant-ui-design.md §7.3 — always called; no-ops immediately when not
// previewed inside the console's iframe (a real end-user visiting directly).
initInspector();

// Tenant Application Logs Phase 5 — always called; unlike initInspector()
// this has no "not previewed" no-op case, it's on for every real visitor.
initFrontendLogs();

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element #root not found");
}

createRoot(container).render(
  <StrictMode>
    <FrontendErrorBoundary>
      <BrowserRouter>
        <AuthProvider backendInstanceSlug="teamboardapi">
      <App />
    </AuthProvider>
      </BrowserRouter>
    </FrontendErrorBoundary>
  </StrictMode>,
);
