// Data-driven game configuration. Rename the game by editing GAME_NAME.
export const GAME_NAME = "Another Year";
export const SAVE_KEY = "lifesim.save.v1";
export const SETTINGS_KEY = "lifesim.settings.v1";

export type ProfessionId = "footballer" | "chess" | "boxer" | "musician" | "artist" | "actor" | "cowboy";
export type EraId = "modern" | "oldwest";

export interface Era {
  id: EraId;
  label: string;
  yearRange: [number, number]; // possible start years
  moneyLabel: string;
  schoolLabel: string;
}

export const ERAS: Record<EraId, Era> = {
  modern: { id: "modern", label: "Present day", yearRange: [2024, 2026], moneyLabel: "Bank balance", schoolLabel: "High school" },
  oldwest: { id: "oldwest", label: "American Old West", yearRange: [1858, 1880], moneyLabel: "Cash", schoolLabel: "Schoolhouse" },
};

export interface Profession {
  id: ProfessionId;
  name: string;
  category: "Sport" | "Creativity" | "Others";
  era: EraId;
  skillName: string;
  blurb: string;
  wip?: boolean;
  emoji: string;
  titles: string[]; // by career level 0..n
  salaries: number[]; // yearly income by level (adult)
  fixedCountry?: string;
}

export const PROFESSIONS: Profession[] = [
  { id: "footballer", name: "Footballer", category: "Sport", era: "modern", skillName: "Ball control", emoji: "⚽", blurb: "Time your strikes, climb from youth team to the big stage.",
    titles: ["Youth prospect", "Academy player", "Semi-pro", "Pro squad player", "First-team star", "Club legend"], salaries: [0, 4000, 18000, 60000, 250000, 900000] },
  { id: "chess", name: "Chess Player", category: "Sport", era: "modern", skillName: "Calculation", emoji: "♟", blurb: "Solve real positions, earn titles, outthink rivals.",
    titles: ["Club newcomer", "Club player", "Candidate master", "International master", "Grandmaster", "World elite"], salaries: [0, 1500, 9000, 30000, 85000, 300000] },
  { id: "boxer", name: "Boxer", category: "Sport", era: "modern", skillName: "Ring craft", emoji: "🥊", blurb: "Read your opponent, pick your moment, keep your balance.",
    titles: ["Gym rookie", "Amateur", "Regional contender", "Pro prospect", "Title contender", "Champion"], salaries: [0, 2000, 12000, 50000, 200000, 1200000] },
  { id: "musician", name: "Musician", category: "Creativity", era: "modern", skillName: "Musicianship", emoji: "🎹", blurb: "Play in time and compose your own melodies.",
    titles: ["Bedroom player", "Open-mic regular", "Local act", "Touring musician", "Charting artist", "Icon"], salaries: [0, 3000, 14000, 45000, 180000, 800000] },
  { id: "artist", name: "Artist", category: "Creativity", era: "modern", skillName: "Technique", emoji: "🎨", blurb: "Draw, refine, exhibit. Build a body of work.",
    titles: ["Sketcher", "Art student", "Exhibiting artist", "Gallery-represented", "Acclaimed artist", "Master"], salaries: [0, 2000, 10000, 35000, 120000, 500000] },
  { id: "actor", name: "Actor", category: "Creativity", era: "modern", skillName: "Performance", emoji: "🎭", blurb: "Coming soon.", wip: true, titles: ["Extra"], salaries: [0] },
  { id: "cowboy", name: "Cowboy", category: "Others", era: "oldwest", skillName: "Frontier grit", emoji: "🤠", blurb: "Ride the frontier between 1850 and 1916. Quick reflexes, steady nerves.",
    titles: ["Ranch hand", "Wrangler", "Trail rider", "Trail boss", "Ranch foreman", "Frontier legend"], salaries: [0, 120, 300, 700, 1500, 4000], fixedCountry: "United States" },
];

export const getProfession = (id: ProfessionId) => PROFESSIONS.find((p) => p.id === id)!;

// Skill thresholds for each career level (index = level).
export const LEVEL_THRESHOLDS = [0, 15, 32, 50, 68, 86];

export const COUNTRIES = ["United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "Spain", "Italy", "Brazil", "Argentina", "Mexico", "Nigeria", "India", "Japan", "Sweden", "Poland"];

export type Background = "ordinary" | "affluent" | "struggling" | "single";
export const BACKGROUNDS: { id: Background; label: string; desc: string; money: number; expenses: number }[] = [
  { id: "ordinary", label: "Ordinary family", desc: "Steady, unremarkable, mostly kind.", money: 300, expenses: 0 },
  { id: "affluent", label: "Affluent family", desc: "Comfort and connections.", money: 3000, expenses: 0 },
  { id: "struggling", label: "Struggling family", desc: "Tight budgets, strong resolve.", money: 20, expenses: 0 },
  { id: "single", label: "Single-parent home", desc: "One parent, doing the work of two.", money: 120, expenses: 0 },
];

export const SKIN_TONES = ["oklch(0.86 0.05 70)", "oklch(0.76 0.08 60)", "oklch(0.64 0.09 50)", "oklch(0.5 0.08 45)", "oklch(0.38 0.06 40)"];
export const HAIR_COLORS = ["oklch(0.2 0.02 50)", "oklch(0.42 0.08 50)", "oklch(0.7 0.11 80)", "oklch(0.55 0.15 35)", "oklch(0.82 0.01 80)"];
export const SHIRT_COLORS = ["oklch(0.76 0.15 62)", "oklch(0.6 0.12 240)", "oklch(0.62 0.14 150)", "oklch(0.6 0.18 25)", "oklch(0.45 0.02 60)"];

export const FIRST_NAMES = {
  modern: ["Alex", "Sam", "Jordan", "Maya", "Leo", "Nina", "Omar", "Iris", "Theo", "Zoe", "Ravi", "Elena", "Kai", "Lucia", "Ben", "Ada"],
  oldwest: ["Eli", "Clara", "Jeb", "Martha", "Silas", "Ada", "Wyatt", "Hattie", "Amos", "Josephine", "Cyrus", "Lottie", "Ezra", "Mae"],
};
export const LAST_NAMES = {
  modern: ["Moreno", "Kim", "Okafor", "Novak", "Larsen", "Patel", "Rossi", "Hughes", "Silva", "Becker", "Tanaka", "Walsh"],
  oldwest: ["Haskell", "McCready", "Barlow", "Whitlock", "Dunning", "Pruitt", "Calloway", "Thorne", "Granger", "Hollis"],
};
export const TRAITS = ["warm", "stubborn", "funny", "anxious", "ambitious", "loyal", "quiet", "reckless", "wise", "proud"];