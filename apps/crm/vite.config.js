import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// CRM web (Cloudflare Pages na produção). Dev em :5173.
export default defineConfig({
    plugins: [react()],
    server: { port: 5173, host: true },
});
