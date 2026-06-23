import { describe, expect, it } from "vitest";
import {
  buildExpansionMessages,
  buildInitialParseMessages,
  buildQuestionMessages,
  parseLearningJson
} from "./prompts";

describe("parseLearningJson", () => {
  it("parses explanation and knowledge points", () => {
    const result = parseLearningJson(
      JSON.stringify({
        title: "React State",
        summary: "How state changes UI",
        content: "State lets components remember values.",
        knowledgePoints: [{ title: "useState", summary: "Local component state" }]
      })
    );

    expect(result.knowledgePoints[0].title).toBe("useState");
  });

  it("rejects invalid JSON with a clear error", () => {
    expect(() => parseLearningJson("{not-json")).toThrow("AI output was not valid JSON");
  });

  it("rejects output missing required fields", () => {
    expect(() =>
      parseLearningJson(
        JSON.stringify({
          title: "React State",
          summary: "How state changes UI",
          knowledgePoints: []
        })
      )
    ).toThrow("AI output did not match the expected learning JSON shape");
  });
});

describe("prompt builders", () => {
  it("builds initial parse messages from source and node context", () => {
    const messages = buildInitialParseMessages(
      {
        type: "book",
        title: "Designing Data-Intensive Applications",
        author: "Martin Kleppmann",
        description: "Distributed systems book",
        learningGoal: "Understand replication",
        rawInput: "Chapter notes"
      },
      {
        title: "DDIA",
        summary: "System design",
        content: "Replication and consistency"
      }
    );

    expect(messages[0].role).toBe("system");
    expect(messages[1].content).toContain("Designing Data-Intensive Applications");
    expect(messages[1].content).toContain("Replication and consistency");
  });

  it("builds expansion and question prompts", () => {
    const expansion = buildExpansionMessages(
      { title: "React State", content: "State lets components remember values." },
      { title: "useState", summary: "Local component state" },
      "Explain lazy initial state."
    );
    const question = buildQuestionMessages(
      { title: "React State", content: "State lets components remember values." },
      "Why does state update asynchronously?"
    );

    expect(expansion[1].content).toContain("useState");
    expect(expansion[1].content).toContain("Explain lazy initial state.");
    expect(question[1].content).toContain("Why does state update asynchronously?");
  });
});
