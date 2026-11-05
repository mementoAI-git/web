export interface ReflectionEntry {
  question: string;
  category?: string;
  request: {
    prompt_type: "static" | "ai-generated";
    prompt_id?: string;
    prompt_text?: string;
    reflection_day_key: string;
  };
}
