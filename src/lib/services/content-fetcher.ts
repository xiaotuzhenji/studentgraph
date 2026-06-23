import * as cheerio from "cheerio";
import dns from "node:dns/promises";
import * as http from "node:http";
import * as https from "node:https";
import net from "node:net";
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

function isPrivateIp(address: string) {
  if (address.startsWith("::ffff:")) {
    return isPrivateIp(address.slice(7));
  }

  const family = net.isIP(address);
  if (family === 4) {
    const parts = address.split(".").map(Number);
    const [a, b] = parts;

    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    );
  }

  if (family === 6) {
    const value = address.toLowerCase();
    return value === "::1" || value.startsWith("fc") || value.startsWith("fd") || value.startsWith("fe80:");
  }

  return true;
}

async function resolveSafeUrl(value: string) {
  try {
    const url = new URL(value);
    if ((url.protocol !== "https:" && url.protocol !== "http:") || isBlockedHostname(url.hostname)) {
      return null;
    }

    if (net.isIP(url.hostname)) {
      return isPrivateIp(url.hostname) ? null : { url, address: url.hostname };
    }

    const addresses = await dns.lookup(url.hostname, { all: true });
    if (addresses.length === 0 || addresses.some((address) => isPrivateIp(address.address))) {
      return null;
    }

    return { url, address: addresses[0].address };
  } catch {
    return null;
  }
}

function hasLargeContentLength(headers: http.IncomingHttpHeaders) {
  const value = Array.isArray(headers["content-length"]) ? headers["content-length"][0] : headers["content-length"];
  const length = Number(value);
  return Number.isFinite(length) && length > maxContentLength;
}

function readUrlText(url: URL, address: string) {
  const client = url.protocol === "https:" ? https : http;

  return new Promise<string | null>((resolve) => {
    let settled = false;
    let totalLength = 0;
    const chunks: Buffer[] = [];
    const finish = (value: string | null) => {
      if (!settled) {
        settled = true;
        resolve(value);
      }
    };
    const request = client.request(
      url,
      {
        headers: { Accept: "text/html,application/xhtml+xml" },
        lookup: (_hostname, _options, callback) => callback(null, address, net.isIP(address)),
        timeout: fetchTimeoutMs
      },
      (response) => {
        if ((response.statusCode ?? 0) < 200 || (response.statusCode ?? 0) >= 300 || hasLargeContentLength(response.headers)) {
          response.resume();
          finish(null);
          return;
        }

        response.on("data", (chunk: Buffer) => {
          totalLength += chunk.length;
          if (totalLength > maxContentLength) {
            request.destroy();
            finish(null);
            return;
          }
          chunks.push(chunk);
        });
        response.on("end", () => finish(Buffer.concat(chunks).toString("utf8")));
        response.on("error", () => finish(null));
      }
    );

    request.on("timeout", () => {
      request.destroy();
      finish(null);
    });
    request.on("error", () => finish(null));
    request.end();
  });
}

export async function fetchSourceContent(input: SourceInput): Promise<FetchSourceContentResult> {
  if (!input.url || input.type === "question" || input.type === "book") {
    return { status: "idle" };
  }

  const resolved = await resolveSafeUrl(input.url);
  if (!resolved) {
    return { status: "failed" };
  }

  try {
    const html = await readUrlText(resolved.url, resolved.address);
    if (!html) {
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
