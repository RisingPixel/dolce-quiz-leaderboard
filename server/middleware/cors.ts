import { defineEventHandler, getMethod, setResponseHeader } from "h3";

export default defineEventHandler((event) => {
  if (!event.path?.startsWith("/api/")) return;

  if (getMethod(event) === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  setResponseHeader(event, "Access-Control-Allow-Origin", "*");
});
