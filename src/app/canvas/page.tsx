import { requireCurrentUser } from "@/lib/auth/current-user";

export default async function CanvasPage() {
  await requireCurrentUser();

  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Learning Canvas</h1>
    </main>
  );
}
