import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const PreviewInput = z.object({
  prompt: z.string().trim().min(2, "So'rov juda qisqa").max(500),
  variation: z.number().int().min(0).max(50).default(0),
});

export const generateSitePreview = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => PreviewInput.parse(d))
  .handler(async ({ data }) => {
    const { generateHtmlSite } = await import("./ai.server");
    const html = await generateHtmlSite(data.prompt, data.variation);
    return { html };
  });