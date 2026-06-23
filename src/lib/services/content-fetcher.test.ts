import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchSourceContent } from "./content-fetcher";

describe("fetchSourceContent", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("skips question and book sources", async () => {
    await expect(fetchSourceContent({ type: "question", title: "What is indexing?" })).resolves.toEqual({
      status: "idle"
    });
    await expect(fetchSourceContent({ type: "book", title: "A book" })).resolves.toEqual({ status: "idle" });
  });

  it("extracts title, description, and body text for link sources", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: () =>
          Promise.resolve(`
            <html>
              <head>
                <title>Fetched Title</title>
                <meta name="description" content="Fetched description" />
              </head>
              <body><script>ignored()</script><main>Hello <strong>world</strong></main></body>
            </html>
          `)
      })
    );

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

  it("returns failed when fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    await expect(
      fetchSourceContent({ type: "project_link", title: "Project", url: "https://example.com" })
    ).resolves.toEqual({ status: "failed" });
  });
});
