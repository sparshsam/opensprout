import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.sparshsam.opensprout",
  appName: "OpenSprout",
  webDir: "out",
  server: {
    // Development: set CAPACITOR_DEV_URL=http://localhost:3000 for live reload
    url: process.env.CAPACITOR_DEV_URL || undefined,
    androidScheme: "https",
    // cleartext: disabled for production — set CAPACITOR_CLEARTEXT=true for local dev
    cleartext: process.env.CAPACITOR_CLEARTEXT === "true",
    allowNavigation: ["opensprout://*"],
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: "#f8fbf9",
    },
    Camera: {
      // Camera plugin uses default Capacitor permissions
    },
    LocalNotifications: {
      smallIcon: "ic_stat_sprout",
      iconColor: "#16784f",
    },
  },
};

export default config;
