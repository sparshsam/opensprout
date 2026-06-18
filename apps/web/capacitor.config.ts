import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.sparshsam.opensprout",
  appName: "OpenSprout",
  webDir: "out",
  server: {
    // Development: set CAPACITOR_DEV_URL=http://localhost:3000 for live reload
    url: process.env.CAPACITOR_DEV_URL || undefined,
    androidScheme: "https",
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: "#f8fbf9",
    },
    Camera: {
      // Camera plugin uses default Capacitor permissions
    },
  },
};

export default config;
