// Minimal profanity filter for Italian and English. Returns true if name is OK.
const BAD_WORDS = [
  "merda", "cazzo", "stronzo", "stronza", "puttana", "vaffanculo", "fanculo",
  "bastardo", "bastarda", "coglione", "coglioni", "troia", "porca", "negro",
  "frocio", "checca", "minchia", "figa", "fica", "culo",
  "fuck", "shit", "bitch", "asshole", "cunt", "dick", "pussy", "nigger",
  "faggot", "whore", "slut", "bastard",
];

export function isCleanName(name: string): boolean {
  const lower = name.toLowerCase();
  // Word-boundary-ish check: split on non-letter chars
  const tokens = lower.split(/[^\p{L}]+/u).filter(Boolean);
  for (const t of tokens) {
    if (BAD_WORDS.includes(t)) return false;
  }
  // also catch concatenated forms
  for (const w of BAD_WORDS) {
    if (lower.includes(w)) return false;
  }
  return true;
}
