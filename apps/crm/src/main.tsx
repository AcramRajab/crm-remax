import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { applyBrand } from "./lib/tenant";
import { SessionProvider } from "./lib/session";
import { AuthProvider } from "./lib/auth";
import { StoreProvider } from "./lib/store";

// White-label: aplica a cor da conta antes de renderizar.
applyBrand();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SessionProvider>
          <StoreProvider>
            <App />
          </StoreProvider>
        </SessionProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
