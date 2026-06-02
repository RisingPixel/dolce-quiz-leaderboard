import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { safeEqual } from "@/lib/safe-equal";

const schema = z.object({ password: z.string().min(1) });

export const Route = createFileRoute("/api/public/admin/login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const adminPassword = process.env.ADMIN_PASSWORD;
        if (!adminPassword) {
          return Response.json({ success: false, error: "Server not configured" }, { status: 500 });
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ success: false, error: "Invalid JSON" }, { status: 400 });
        }

        const parsed = schema.safeParse(body);
        if (!parsed.success) {
          return Response.json({ success: false, error: "Validation failed" }, { status: 400 });
        }

        if (!safeEqual(parsed.data.password, adminPassword)) {
          return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        return Response.json({ success: true });
      },
    },
  },
});
