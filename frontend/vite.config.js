import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Celulares con navegadores de hace unos años (Chrome 87+, Safari 14+):
  // el código moderno se traduce para que también funcione ahí
  build: { target: ["es2020", "chrome87", "safari14", "firefox78", "edge88"], cssTarget: ["chrome87", "safari14", "firefox78", "edge88"] },
});