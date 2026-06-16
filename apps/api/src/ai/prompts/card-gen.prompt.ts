export function buildCardGenPrompt(noteTitle: string, noteContent: string, count: number): string {
  return `You are an expert learning coach. Analyze the following note and generate exactly ${count} high-quality flashcards.

NOTE TITLE: ${noteTitle}

NOTE CONTENT:
${noteContent.slice(0, 4000)}

Generate ${count} flashcards as a JSON array. Each card must have:
- "type": one of "basic", "cloze", "code", "formula", "translation", "definition"
- "front": the question, prompt, or cloze text (use {{blank}} for cloze deletions)
- "back": the complete answer or filled cloze

Rules:
- Prefer "definition" for terms with clear definitions
- Prefer "cloze" for filling in key terms in context
- Prefer "code" for programming concepts
- Test understanding and application, not just rote recall
- Keep fronts concise, backs complete but not verbose

Return ONLY valid JSON array, no markdown:
[{"type":"basic","front":"...","back":"..."},...]`;
}
