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

    fireEvent.change(screen.getByLabelText("提供方"), {
      target: { value: "deepseek" }
    });
    fireEvent.change(screen.getByLabelText("显示名称"), {
      target: { value: "Study model" }
    });
    fireEvent.change(screen.getByLabelText("API 地址"), {
      target: { value: "https://api.deepseek.com" }
    });
    fireEvent.change(screen.getByLabelText("模型名称"), {
      target: { value: "deepseek-chat" }
    });
    fireEvent.change(screen.getByLabelText("API 密钥"), {
      target: { value: "sk-test" }
    });
    fireEvent.click(screen.getByRole("button", { name: "添加模型" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("保存模型配置失败。");
    await waitFor(() => expect(screen.getByRole("button", { name: "添加模型" })).toBeEnabled());
  });
});
