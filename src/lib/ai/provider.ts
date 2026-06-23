export type AiMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export interface AiProvider {
  completeJson(input: { model: string; messages: AiMessage[] }): Promise<string>;
}
