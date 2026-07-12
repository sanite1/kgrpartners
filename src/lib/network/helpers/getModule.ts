export type AppModule = "platform" | "app" | "admin";

export const getModule = (): AppModule => {
  const hostname = window.location.hostname;
  const port = window.location.port;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    if (port === "3000") return "platform";
    if (port === "3001") return "app";
    if (port === "3002") return "admin";
    return "platform";
  }
  if (hostname.startsWith("app.")) return "app";
  if (hostname.startsWith("admin.")) return "admin";
  return "platform";
};
