export type LearningCardData = {
  id: string;
  title: string;
  type: string;
  summary: string | null;
  learnedStatus: string;
  generationStatus: string;
} & Record<string, unknown>;

type LearningCardProps = {
  data: LearningCardData;
};

export function LearningCard({ data }: LearningCardProps) {
  return (
    <article
      style={{
        background: "white",
        border: "1px solid #d8dee4",
        borderRadius: "0.875rem",
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.12)",
        minWidth: "15rem",
        padding: "1rem"
      }}
    >
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <span style={{ color: "#2563eb", fontSize: "0.75rem", fontWeight: 700 }}>{data.type}</span>
        <span style={{ color: "#15803d", fontSize: "0.75rem", fontWeight: 700 }}>
          {data.learnedStatus}
        </span>
      </div>

      <h3 style={{ fontSize: "1rem", lineHeight: 1.3, margin: 0 }}>{data.title}</h3>

      {data.summary ? (
        <p style={{ color: "#4b5563", fontSize: "0.875rem", lineHeight: 1.5, margin: "0.75rem 0 0" }}>
          {data.summary}
        </p>
      ) : null}

      <p style={{ color: "#64748b", fontSize: "0.75rem", margin: "0.75rem 0 0" }}>
        {data.generationStatus}
      </p>
    </article>
  );
}
