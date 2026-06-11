// Citation numbering for report pages: insight cite strings (possibly
// compound, "A, 2010; B, 2010") become tiny superscript numbers in the text,
// with one deduplicated, first-appearance-ordered reference list at the end.

export interface CitationIndex {
  refs: string[];
  numbersFor(cite: string): number[];
}

const split = (cite: string) => cite.split(";").map((s) => s.trim()).filter(Boolean);

export function buildCitationIndex(cites: string[]): CitationIndex {
  const refs: string[] = [];
  const order = new Map<string, number>();
  cites.forEach((cite) => {
    split(cite).forEach((ref) => {
      if (!order.has(ref)) {
        refs.push(ref);
        order.set(ref, refs.length); // 1-based
      }
    });
  });
  return {
    refs,
    numbersFor: (cite: string) => split(cite).map((ref) => order.get(ref) ?? 0).filter((n) => n > 0),
  };
}
