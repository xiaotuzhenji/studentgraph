import { describe, expect, it, vi } from "vitest";
import HomePage from "@/app/page";

const redirect = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  redirect
}));

describe("HomePage", () => {
  it("redirects to login", () => {
    HomePage();

    expect(redirect).toHaveBeenCalledWith("/login");
  });
});
