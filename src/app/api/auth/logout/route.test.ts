/* @vitest-environment node */

import { describe, expect, it } from "vitest";
import { sessionCookieName } from "@/lib/auth/current-user";

describe("logout route", () => {
  it("clears the session cookie and redirects to login on POST", async () => {
    const { POST } = await import("./route");
    const response = POST(new Request("http://test.local/api/auth/logout", { method: "POST" }));

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://test.local/login");
    expect(response.headers.get("set-cookie")).toContain(`${sessionCookieName}=`);
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });

  it("redirects direct visits to login", async () => {
    const { GET } = await import("./route");
    const response = GET(new Request("http://test.local/api/auth/logout"));

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://test.local/login");
  });
});
