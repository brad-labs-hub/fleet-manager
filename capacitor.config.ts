import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Hosted Next.js app: the iOS shell loads your deployed Vercel URL.
 * Override for local device testing: CAPACITOR_SERVER_URL=http://192.168.1.x:3000 npm run cap:sync
 */
const serverUrl =
  process.env.CAPACITOR_SERVER_URL ?? "https://crownfleet.vercel.app";

const useHttp = serverUrl.startsWith("http://");

const config: CapacitorConfig = {
  appId: "com.bradlawson.fleetmanager",
  appName: "Fleet Manager",
  webDir: "www",
  server: {
    url: serverUrl,
    cleartext: useHttp,
    allowNavigation: [
      "*.supabase.co",
      "*.vercel.app",
      "localhost",
      "127.0.0.1",
    ],
  },
  ios: {
    contentInset: "automatic",
    scrollEnabled: true,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 1500,
      backgroundColor: "#0f172a",
    },
  },
};

export default config;
