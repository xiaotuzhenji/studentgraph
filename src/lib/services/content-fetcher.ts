import * as cheerio from "cheerio";
import type { z } from "zod";
import type { createSourceSchema } from "@/lib/domain/schemas";

type SourceInput = z.infer<typeof createSourceSchema>;

export type FetchSourceContentResult =
  | { status: "idle" }
  | {
      status: "completed";
      title?: string;
      description?: string;
      content?: string;
    }
  | { status: "failed" };

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export async function fetchSourceContent(input: SourceInput): Promise<FetchSourceContentResult> {
  if (!input.url || input.type === "question" || input.type === "book") {
    return { status: "idle" };
  }

  try {
    const response = await fetch(input.url, {
      headers: {
        Accept: "text/html,application/xhtml+xml"
      }
    });

    if (!response.ok) {
      return { status: "failed" };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    $("script, style, noscript").remove();

    const title = normalizeText($("title").first().text());
    const description = normalizeText(
      $('meta[name="description"]').attr("content") ?? $('meta[property="og:description"]').attr("content") ?? ""
    );
    const content = normalizeText($("body").text()).slice(0, 12000);

    return {
      status: "completed",
      title: title || undefined,
      description: description || undefined,
      content: content || undefined
    };
  } catch {
    return { status: "failed" };
  }
}
