import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'placeholder.svg'], // Add other assets if needed
      manifest: {
        name: 'Housing Nest Arish', // Replace with your app name
        short_name: 'HousingNest', // Replace with a shorter name
        description: 'Your awesome housing application description', // Replace with your app description
        theme_color: '#ffffff', // Replace with your theme color
        background_color: '#ffffff', // Replace with your background color
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'favicon.ico', // Use existing icon, ideally add more sizes (e.g., 192x192, 512x512)
            sizes: '64x64',
            type: 'image/x-icon',
          },
          // Add more icons here for different sizes
          // {
          //   src: 'pwa-192x192.png',
          //   sizes: '192x192',
          //   type: 'image/png',
          // },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      // Let the plugin handle asset caching defaults
      devOptions: {
        enabled: true // Enable PWA in development mode if needed, consider disabling if not needed during dev
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
