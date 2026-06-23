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
        headers: new Headers(),
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

  it("blocks localhost and private network URLs", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      fetchSourceContent({ type: "blog_link", title: "Internal", url: "http://127.0.0.1:3000/admin" })
    ).resolves.toEqual({ status: "failed" });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("limits fetched content size", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-length": "2000000" }),
        text: () => Promise.resolve("<html><body>too large</body></html>")
      })
    );

    await expect(
      fetchSourceContent({ type: "blog_link", title: "Large", url: "https://example.com/large" })
    ).resolves.toEqual({ status: "failed" });
  });
});
