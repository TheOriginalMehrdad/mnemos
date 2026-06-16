export function buildInsightPrompt(
  titleA: string, contentA: string, domainA: string,
  titleB: string, contentB: string, domainB: string,
): string {
  return `You are a knowledge synthesis assistant. Two notes from different domains share an unexpected connection.

NOTE A: "${titleA}" (Domain: ${domainA})
${contentA.slice(0, 800)}

NOTE B: "${titleB}" (Domain: ${domainB})
${contentB.slice(0, 800)}

Write exactly 2 sentences explaining the deep structural connection between these notes.
The connection should be non-obvious and intellectually illuminating.
Do NOT start with "Both" or "These two" — be specific and surprising.
Return ONLY the 2-sentence insight text, no quotes, no preamble.`;
}
