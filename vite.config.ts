import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";
import { visualizer } from "rollup-plugin-visualizer";

const collectReferencedGameLogos = (roots: string[]) => {
  const allowed = new Set<string>();
  const logoPattern = /\/game-logos\/[^'"`)\s,}]+/g;

  const walk = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }
      if (!/\.(tsx?|jsx?|sql|json|md)$/.test(entry.name)) continue;
      const contents = fs.readFileSync(fullPath, "utf8");
      for (const match of contents.matchAll(logoPattern)) {
        allowed.add(match[0].replace(/^\/game-logos\//, ""));
      }
    }
  };

  roots.forEach(walk);
  return allowed;
};

const pruneUnreferencedGameLogos = () => ({
  name: "prune-unreferenced-game-logos",
  closeBundle() {
    const distLogoDir = path.resolve(__dirname, "dist/game-logos");
    if (!fs.existsSync(distLogoDir)) return;

    const distDir = path.resolve(__dirname, "dist");
    const allowed = collectReferencedGameLogos([distDir]);
    const removed: string[] = [];
    let removedBytes = 0;
    let keptCount = 0;

    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath);
          if (fs.existsSync(fullPath) && fs.readdirSync(fullPath).length === 0) {
            fs.rmdirSync(fullPath);
          }
          continue;
        }

        const relativePath = path.relative(distLogoDir, fullPath).split(path.sep).join("/");
        if (!allowed.has(relativePath)) {
          try {
            removedBytes += fs.statSync(fullPath).size;
          } catch {}
          fs.rmSync(fullPath);
          removed.push(`/game-logos/${relativePath}`);
        } else {
          keptCount += 1;
        }
      }
    };

    walk(distLogoDir);

    const kb = (removedBytes / 1024).toFixed(1);
    console.log(
      `\n[prune-unreferenced-game-logos] Kept ${keptCount} referenced logo file(s); removed ${removed.length} unreferenced logo file(s) (${kb} KB) from dist/game-logos`
    );
    if (removed.length) {
      for (const p of removed.sort()) console.log(`  - ${p}`);
    }
  },
});


// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    pruneUnreferencedGameLogos(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "robots.txt", "assets/**/*"],
      manifest: {
        name: "GoLucky - Play. Win. Repeat!",
        short_name: "GoLucky",
        description: "Your ultimate lottery gaming destination. Play Win Go, K3, 5D, and TRX Win games!",
        theme_color: "#f97316",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ],
        categories: ["games", "entertainment"],
        screenshots: []
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,svg,woff2}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MiB limit
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|gif|webp)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    }),
    process.env.ANALYZE ? visualizer({
      filename: "dist/bundle-stats.html",
      template: "treemap",
      gzipSize: true,
      brotliSize: true,
      open: false,
    }) : null,
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
