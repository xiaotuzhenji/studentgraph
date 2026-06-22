import { describe, expect, it } from "vitest";
import { createSourceSchema, createBranchSchema } from "./schemas";

describe("domain schemas", () => {
  it("accepts a book source with a learning goal", () => {
    const result = createSourceSchema.parse({
      type: "book",
      title: "Designing Data-Intensive Applications",
      author: "Martin Kleppmann",
      learningGoal: "Understand data system tradeoffs",
      description: "Focus on replication and consistency"
    });

    expect(result.type).toBe("book");
  });

  it("rejects a video source", () => {
    expect(() =>
      createSourceSchema.parse({
        type: "video",
        title: "A lecture"
      })
    ).toThrow();
  });

  it("accepts a note branch without a model config", () => {
    const result = createBranchSchema.parse({
      kind: "note",
      title: "My note",
      content: "This finally clicked."
    });

    expect(result.kind).toBe("note");
  });
});
