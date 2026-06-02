import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { isCleanName } from "@/lib/profanity";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const schema = z.object({
  name: z.string().trim().min(1).max(30),
  score: z.number().int().min(0).max(1_000_000),
});

export const Route = createFileRoute("/api/public/score")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json(
            { success: false, error: "Invalid JSON" },
            { status: 400, headers: corsHeaders },
          );
        }

        const parsed = schema.safeParse(body);
        if (!parsed.success) {
          return Response.json(
            { success: false, error: "Validation failed", details: parsed.error.flatten() },
            { status: 400, headers: corsHeaders },
          );
        }

        const { name, score } = parsed.data;

        if (!isCleanName(name)) {
          return Response.json(
            { success: false, error: "Nome non consentito" },
            { status: 400, headers: corsHeaders },
          );
        }

        const { data, error } = await supabaseAdmin
          .from("leaderboard_entries")
          .insert({ name, score })
          .select("id")
          .single();

        if (error) {
          console.error("Insert failed:", error);
          return Response.json(
            { success: false, error: "Database error" },
            { status: 500, headers: corsHeaders },
          );
        }

        return Response.json(
          { success: true, id: data.id },
          { status: 201, headers: corsHeaders },
        );
      },
    },
  },
});
