export function buildQuizGenPrompt(
  noteContent: string,
  questionCount: number,
  types: string[],
): string {
  const typeList = types.join(', ');
  return `You are an expert educator. Generate exactly ${questionCount} quiz questions from the content below.

CONTENT:
${noteContent.slice(0, 4000)}

Question types to include: ${typeList}
- "mc": multiple choice with exactly 4 options array, answer is the correct option string
- "tf": true/false, options: ["True", "False"], answer: "True" or "False"
- "fill": fill in the blank, answer is the missing word/phrase
- "short": short answer, answer is a concise 1-2 sentence expected answer

Generate questions that test understanding and application, not just memorization.
At least 30% of questions should require reasoning.

Return ONLY a valid JSON array:
[{"type":"mc","prompt":"...","options":["a","b","c","d"],"answer":"a","explanation":"..."},...]

For "fill" and "short" types, options should be an empty array [].`;
}
