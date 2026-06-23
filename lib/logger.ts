/**
 * Sandbox-to-Agent Diagnostic Logging Bridge.
 * Intercepts console logs and unhandled errors, sending them to a local loopback server
 * so the development agent can inspect active browser errors.
 */

const RECEIVER_URL = "http://127.0.0.1:7703/log";

interface LogPayload {
  type: "log" | "error" | "warn" | "exception";
  message: string;
  stack?: string;
  timestamp: string;
}

async function sendToAgent(payload: LogPayload) {
  try {
    await fetch(RECEIVER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      mode: "cors",
    });
  } catch {
    // Fail silently if the log receiver is not running
  }
}

export function initDiagnosticLogger() {
  if (typeof window === "undefined") return;

  // 1. Intercept standard console methods
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  console.log = (...args) => {
    originalLog(...args);
    sendToAgent({
      type: "log",
      message: args.map(arg => typeof arg === "object" ? JSON.stringify(arg) : String(arg)).join(" "),
      timestamp: new Date().toISOString(),
    });
  };

  console.error = (...args) => {
    originalError(...args);
    sendToAgent({
      type: "error",
      message: args.map(arg => typeof arg === "object" ? JSON.stringify(arg) : String(arg)).join(" "),
      timestamp: new Date().toISOString(),
    });
  };

  console.warn = (...args) => {
    originalWarn(...args);
    sendToAgent({
      type: "warn",
      message: args.map(arg => typeof arg === "object" ? JSON.stringify(arg) : String(arg)).join(" "),
      timestamp: new Date().toISOString(),
    });
  };

  // 2. Intercept uncaught JS exceptions
  window.addEventListener("error", (event) => {
    sendToAgent({
      type: "exception",
      message: event.message || "Uncaught JS Exception",
      stack: event.error?.stack,
      timestamp: new Date().toISOString(),
    });
  });

  // 3. Intercept uncaught promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    sendToAgent({
      type: "exception",
      message: event.reason?.message || String(event.reason) || "Unhandled Promise Rejection",
      stack: event.reason?.stack,
      timestamp: new Date().toISOString(),
    });
  });

  console.log("[Diagnostics] Logger initialized and connected to agent.");
}
