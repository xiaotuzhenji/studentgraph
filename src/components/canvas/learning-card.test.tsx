import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LearningCard } from "./learning-card";

describe("LearningCard", () => {
  it("shows title, type, and learned status", () => {
    render(
      <LearningCard
        data={{
          id: "node_1",
          title: "React Hooks",
          type: "source",
          summary: "Learn useState and useEffect",
          learnedStatus: "learned",
          generationStatus: "completed"
        }}
      />
    );

    expect(screen.getByText("React Hooks")).toBeVisible();
    expect(screen.getByText("source")).toBeVisible();
    expect(screen.getByText("learned")).toBeVisible();
  });
});
