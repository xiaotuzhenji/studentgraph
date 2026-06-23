import { EventEmitter } from "node:events";
import { beforeEach, describe, expect, it, vi } from "vitest";

const dns = vi.hoisted(() => ({
  lookup: vi.fn()
}));

const https = vi.hoisted(() => ({
  request: vi.fn()
}));

const http = vi.hoisted(() => ({
  request: vi.fn()
}));

vi.mock("node:dns/promises", () => ({ default: dns }));
vi.mock("node:https", () => https);
vi.mock("node:http", () => http);

class MockRequest extends EventEmitter {
  destroy = vi.fn();
  end = vi.fn();
}

function mockHttpsResponse(input: {
  body?: string;
  contentLength?: string;
  statusCode?: number;
}) {
  const request = new MockRequest();
  https.request.mockImplementation((_url, _options, callback) => {
    const response = new EventEmitter() as EventEmitter & {
      headers: Record<string, string>;
      resume: () => void;
      statusCode: number;
    };
    response.headers = input.contentLength ? { "content-length": input.contentLength } : {};
    response.statusCode = input.statusCode ?? 200;
    response.resume = vi.fn();

    queueMicrotask(() => {
      callback(response);
      if (input.body) {
        response.emit("data", Buffer.from(input.body));
      }
      response.emit("end");
    });

    return request;
  });
  return request;
}

describe("fetchSourceContent", () => {
  beforeEach(() => {
    dns.lookup.mockReset();
    http.request.mockReset();
    https.request.mockReset();
    dns.lookup.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
  });

  it("skips question and book sources", async () => {
    const { fetchSourceContent } = await import("./content-fetcher");

    await expect(fetchSourceContent({ type: "question", title: "What is indexing?" })).resolves.toEqual({
      status: "idle"
    });
    await expect(fetchSourceContent({ type: "book", title: "A book" })).resolves.toEqual({ status: "idle" });
  });

  it("extracts title, description, and body text for link sources", async () => {
    mockHttpsResponse({
      body: `
        <html>
          <head>
            <title>Fetched Title</title>
            <meta name="description" content="Fetched description" />
          </head>
          <body><script>ignored()</script><main>Hello <strong>world</strong></main></body>
        </html>
      `
    });

    const { fetchSourceContent } = await import("./content-fetcher");
    const result = await fetchSourceContent({
      type: "blog_link",
      title: "Fallback",
      url: "https://example.com/post"
    });

    expect(result).toEqual({
      status: "completed",
      title: "Fetched Title",
      description: "Fetched description",
      content: "Hello world"
    });
  });

  it("returns failed when the request fails", async () => {
    const request = new MockRequest();
    https.request.mockImplementation(() => {
      queueMicrotask(() => request.emit("error", new Error("network down")));
      return request;
    });

    const { fetchSourceContent } = await import("./content-fetcher");

    await expect(
      fetchSourceContent({ type: "project_link", title: "Project", url: "https://example.com" })
    ).resolves.toEqual({ status: "failed" });
  });

  it("blocks localhost and private network URLs", async () => {
    const { fetchSourceContent } = await import("./content-fetcher");

    await expect(
      fetchSourceContent({ type: "blog_link", title: "Internal", url: "http://127.0.0.1:3000/admin" })
    ).resolves.toEqual({ status: "failed" });

    expect(http.request).not.toHaveBeenCalled();
    expect(https.request).not.toHaveBeenCalled();
  });

  it("blocks hostnames that resolve to private network addresses", async () => {
    dns.lookup.mockResolvedValue([{ address: "127.0.0.1", family: 4 }]);

    const { fetchSourceContent } = await import("./content-fetcher");

    await expect(
      fetchSourceContent({ type: "blog_link", title: "Internal", url: "https://localtest.me/admin" })
    ).resolves.toEqual({ status: "failed" });

    expect(https.request).not.toHaveBeenCalled();
  });

  it("limits fetched content size by header and stream length", async () => {
    mockHttpsResponse({ contentLength: "2000000" });

    const { fetchSourceContent } = await import("./content-fetcher");

    await expect(
      fetchSourceContent({ type: "blog_link", title: "Large", url: "https://example.com/large" })
    ).resolves.toEqual({ status: "failed" });

    mockHttpsResponse({ body: "x".repeat(600_000) });

    await expect(
      fetchSourceContent({ type: "blog_link", title: "Large", url: "https://example.com/large" })
    ).resolves.toEqual({ status: "failed" });
  });
});
