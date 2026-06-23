import * as cheerio from "cheerio";
import type { z } from "zod";
import type { createSourceSchema } from "@/lib/domain/schemas";

type SourceInput = z.infer<typeof createSourceSchema>;
const maxContentLength = 512_000;
const fetchTimeoutMs = 8_000;

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

function isBlockedHostname(hostname: string) {
  const value = hostname.toLowerCase();

  if (value === "localhost" || value.endsWith(".localhost")) return true;
  if (value === "0.0.0.0" || value === "127.0.0.1" || value === "::1") return true;
  if (value.startsWith("127.")) return true;
  if (value.startsWith("10.") || value.startsWith("192.168.")) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(value)) return true;
  if (value.startsWith("169.254.") || value === "169.254.169.254") return true;
  if (value.startsWith("[") && value.endsWith("]")) return true;

  return false;
}

function isSafeFetchUrl(value: string) {
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && !isBlockedHostname(url.hostname);
  } catch {
    return false;
  }
}

function hasLargeContentLength(response: Response) {
  const length = Number(response.headers.get("content-length"));
  return Number.isFinite(length) && length > maxContentLength;
}

export async function fetchSourceContent(input: SourceInput): Promise<FetchSourceContentResult> {
  if (!input.url || input.type === "question" || input.type === "book") {
    return { status: "idle" };
  }

  if (!isSafeFetchUrl(input.url)) {
    return { status: "failed" };
  }

  try {
    const response = await fetch(input.url, {
      headers: {
        Accept: "text/html,application/xhtml+xml"
      },
      redirect: "error",
      signal: AbortSignal.timeout(fetchTimeoutMs)
    });

    if (!response.ok || hasLargeContentLength(response)) {
      return { status: "failed" };
    }

    const html = await response.text();
    if (html.length > maxContentLength) {
      return { status: "failed" };
    }

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
