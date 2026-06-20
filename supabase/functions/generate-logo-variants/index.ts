import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const JSON_HEADERS = { ...corsHeaders, "Content-Type": "application/json" };

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

const ALLOWED_VARIANTS = new Set(["compact", "dark", "light"]);
const UUID_RE = /^[0-9a-f-]{32,40}$/i;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // ─── Auth ──────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return jsonResponse({ error: "Niet geauthenticeerd" }, 401);
    }
    const token = authHeader.slice("Bearer ".length);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) {
      return jsonResponse({ error: "Ongeldige sessie" }, 401);
    }
    const userId = claims.claims.sub as string;

    // ─── Payload validation ──────────────────────────────
    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const logoUrl = typeof body.logoUrl === "string" ? body.logoUrl : "";
    const tenantId = typeof body.tenantId === "string" ? body.tenantId : "";
    const variant = typeof body.variant === "string" ? body.variant : "";

    if (!logoUrl.startsWith("https://") || logoUrl.length > 2048) {
      return jsonResponse({ error: "Ongeldige logoUrl" }, 400);
    }
    if (!UUID_RE.test(tenantId)) {
      return jsonResponse({ error: "Ongeldige tenantId" }, 400);
    }
    if (!ALLOWED_VARIANTS.has(variant)) {
      return jsonResponse({ error: `Onbekende variant: ${variant}` }, 400);
    }

    // ─── Tenant check ─────────────────────────────────────
    const sbAdmin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: profile } = await sbAdmin
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .maybeSingle();
    if (!profile?.tenant_id || profile.tenant_id !== tenantId) {
      return jsonResponse({ error: "Geen toegang tot deze tenant" }, 403);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompts: Record<string, string> = {
      compact: "Extract only the icon, symbol, or monogram from this logo. Remove any text, tagline, or wordmark. Keep only the graphical mark. Output it centered on a transparent background, suitable for use as a small app icon or favicon. If the logo has no distinct icon element, create a clean monogram from the first letter(s). Maintain the exact same colors and style.",
      dark: "Create a version of this logo optimized for dark backgrounds. Invert or lighten the colors so it has strong contrast and readability on a dark/black background. Keep the exact same shape, layout and proportions. Use white or light-colored elements where the original uses dark colors. Maintain brand recognition. Output on a transparent background.",
      light: "Create a version of this logo optimized for light/white backgrounds. Ensure it has strong contrast and readability on light backgrounds. If it already works on light backgrounds, refine it slightly for maximum clarity. Keep the exact same shape, layout and proportions. Use dark or saturated elements. Maintain brand recognition. Output on a transparent background.",
    };
    const prompt = prompts[variant];

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: logoUrl } },
          ],
        }],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      throw new Error(`AI gateway returned ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const generatedImageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!generatedImageUrl) {
      return jsonResponse({ error: "AI could not generate a variant for this logo", unsupported: true });
    }

    const base64Match = generatedImageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) throw new Error("Unexpected image format from AI");

    const ext = base64Match[1] === "jpeg" ? "jpg" : base64Match[1];
    const imageBytes = Uint8Array.from(atob(base64Match[2]), (c) => c.charCodeAt(0));

    const path = `${tenantId}/${variant}_logo_${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await sbAdmin.storage
      .from("tenant-assets")
      .upload(path, imageBytes, { contentType: `image/${ext}`, upsert: false });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = sbAdmin.storage.from("tenant-assets").getPublicUrl(path);
    return jsonResponse({ url: publicUrl, variant });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Onbekende fout";
    console.error("generate-logo-variants error:", message);
    return jsonResponse({ error: message }, 500);
  }
});
