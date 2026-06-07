import { reactRouter } from "@react-router/dev/vite"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  server: {
    port: 3000,
    allowedHosts: [".lootopia.io"],
    proxy: {
      "/sso": {
        target: "https://sso.lootopia.io",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sso/, "/"),
      },
    },
  },
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths()
  ],
})
