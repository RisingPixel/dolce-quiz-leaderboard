// Short/ambiguous words verified only as exact tokens — substring match would cause false
// positives (e.g. "negro" in "Montenegro", "troia" in "Troiano", "culo" in Latin words).
const TOKEN_ONLY_WORDS = new Set([
  // brevi/ambigui: anche cognomi, toponimi o parole comuni in altre lingue
  "negro", "troia", "porca", "porco", "figa", "fica", "culo", "checca", "cagna",
  "vacca", "fessa", "pirla",
]);

// Longer, specific words safe for substring matching — also catches compound forms
// like "stronzetto", "merdaccia", "affanculone".
const SUBSTRING_WORDS = [
  // Italian
  "merda", "cazzo", "stronzo", "stronza", "puttana", "vaffanculo", "fanculo", "affanculo",
  "bastardo", "bastarda", "coglione", "coglioni", "frocio", "minchia",
  "cornuto", "cornuta", "mignotta", "zoccola", "baldracca", "ricchione", "porcodio",
  "incula", "sborra", "culattone", "vaffa",
  // English
  "fuck", "shit", "bitch", "asshole", "cunt", "dick", "pussy", "nigger",
  "faggot", "whore", "slut", "bastard",
];

export function isCleanName(name: string): boolean {
  const lower = name.toLowerCase();
  const tokens = lower.split(/[^\p{L}]+/u).filter(Boolean);

  for (const t of tokens) {
    if (TOKEN_ONLY_WORDS.has(t)) return false;
  }

  for (const w of SUBSTRING_WORDS) {
    if (lower.includes(w)) return false;
  }

  return true;
}
