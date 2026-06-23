import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ModelConfigForm } from "./model-config-form";

describe("ModelConfigForm", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows an error and re-enables submit when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    render(<ModelConfigForm />);

    fireEvent.change(screen.getByLabelText("Provider"), {
      target: { value: "openai-compatible" }
    });
    fireEvent.change(screen.getByLabelText("Display name"), {
      target: { value: "Study model" }
    });
    fireEvent.change(screen.getByLabelText("Model name"), {
      target: { value: "gpt-test" }
    });
    fireEvent.change(screen.getByLabelText("API key"), {
      target: { value: "sk-test" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Add model" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not save model config.");
    await waitFor(() => expect(screen.getByRole("button", { name: "Add model" })).toBeEnabled());
  });
});
