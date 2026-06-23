import { Handle, Position } from "@xyflow/react";

export type LearningCardData = {
  id: string;
  title: string;
  type: string;
  summary: string | null;
  learnedStatus: string;
  generationStatus: string;
  isSelected?: boolean;
  isHighlighted?: boolean;
} & Record<string, unknown>;

type LearningCardProps = {
  data: LearningCardData;
};

export function LearningCard({ data }: LearningCardProps) {
  const className = [
    "learning-card",
    data.isSelected ? "is-selected" : "",
    data.isHighlighted ? "is-highlighted" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      className={className}
      title="单击选中并拖动，双击进入详情，右击打开菜单"
    >
      <Handle id="branch-target" position={Position.Left} style={{ opacity: 0, pointerEvents: "none" }} type="target" />

      <div className="learning-card-topline">
        <span className="learning-card-chip">{data.type}</span>
        <span className="learning-card-chip">{data.learnedStatus}</span>
        {data.isSelected ? <span className="learning-card-chip is-active">可拖动</span> : null}
      </div>

      <h3 className="learning-card-title">{data.title}</h3>

      {data.summary ? <p className="learning-card-summary">{data.summary}</p> : null}

      <p className="learning-card-footer">{data.generationStatus}</p>
      <Handle id="branch-source" position={Position.Right} style={{ opacity: 0, pointerEvents: "none" }} type="source" />
    </article>
  );
}
