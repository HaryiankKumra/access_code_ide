import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(async () => {
  const plugins = [react()];

  // Make lovable-tagger optional
  try {
    const mod: any = await import("lovable-tagger");
    const tagger = mod?.default ?? mod?.lovableTagger;
    if (typeof tagger === "function") {
      plugins.push(tagger());
    }
  } catch {
    // lovable-tagger not installed; ignore to keep dev server running
  }

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
