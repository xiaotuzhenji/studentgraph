import type { AiMessage, AiProvider } from "./provider";

type Fetcher = typeof fetch;

type OpenAiCompatibleProviderInput = {
  baseUrl: string;
  apiKey: string;
  fetcher?: Fetcher;
};

export class OpenAiCompatibleProvider implements AiProvider {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly fetcher: Fetcher;

  constructor(input: OpenAiCompatibleProviderInput) {
    const url = new URL(input.baseUrl);
    if (url.protocol !== "https:") {
      throw new Error("AI provider base URL must use HTTPS");
    }

    this.baseUrl = input.baseUrl.replace(/\/$/, "");
    this.apiKey = input.apiKey;
    this.fetcher = input.fetcher ?? fetch;
  }

  async completeJson(input: { model: string; messages: AiMessage[] }) {
    const response = await this.fetcher(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: input.model,
        messages: input.messages,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error(`AI provider request failed with status ${response.status}`);
    }

    let payload;
    try {
      payload = await response.json();
    } catch {
      throw new Error("AI provider response was not valid JSON");
    }

    const content = payload?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || content.length === 0) {
      throw new Error("AI provider response did not include message content");
    }

    return content;
  }
}
