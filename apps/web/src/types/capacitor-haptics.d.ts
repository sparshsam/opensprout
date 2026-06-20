declare module "@capacitor/haptics" {
  export const Haptics: {
    impact: (options: { style: "light" | "medium" | "heavy" }) => Promise<void>;
    notification: (options: { type: "success" | "error" | "warning" }) => Promise<void>;
  };
}
