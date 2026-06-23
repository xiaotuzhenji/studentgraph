import { render, screen } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import { LearningCard } from "./learning-card";

describe("LearningCard", () => {
  it("shows title, type, and learned status", () => {
    render(
      <ReactFlowProvider>
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
      </ReactFlowProvider>
    );

    expect(screen.getByText("React Hooks")).toBeVisible();
    expect(screen.getByText("source")).toBeVisible();
    expect(screen.getByText("learned")).toBeVisible();
  });
});
