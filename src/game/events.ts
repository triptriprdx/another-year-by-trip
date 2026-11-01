import type { GameState, Outcome } from "./types";
import { canWork, rand, randInt, unlock, type Fx } from "./engine";
import type { ProfessionId } from "./config";

export interface GameEvent {
  id: string;
  title: string;
  weight?: number;
  when?: (s: GameState) => boolean;
  text: (s: GameState) => string;
  choices: { label: string; run: (fx: Fx, s: GameState) => Outcome }[];
}

const isProf = (p: ProfessionId) => (s: GameState) => s.career.profession === p;
const modern = (s: GameState) => s.era === "modern";
const west = (s: GameState) => s.era === "oldwest";
const npc = (s: GameState, role: string) => s.npcs.find((n) => n.alive && n.role === role);
const chance = (s: GameState, p: number) => rand(s) < p;

export const EVENTS: GameEvent[] = [
  // ---------- Generic: school ----------
  {
    id: "exam", title: "Big exam", when: (s) => s.education === "in school",
    text: (s) => (west(s) ? "The schoolteacher announces a recitation test before the whole class." : "Final exams are next week and your notes are a mess."),
    choices: [
      { label: "Study hard every night", run: (fx) => fx.stat("intelligence", 6).stat("energy", -15).stat("mood", -3).outcome("You knew every answer. Exhausting, but worth it.") },
      { label: "Study a reasonable amount", run: (fx, s) => (chance(s, 0.6) ? fx.stat("intelligence", 3).outcome("A solid pass.") : fx.stat("intelligence", 1).stat("mood", -2).outcome("You scraped by.")) },
      { label: "Skip it and focus on your craft", run: (fx) => fx.stat("intelligence", -3).skill(3).rel("family", -5).outcome("Your grades slipped, your parents noticed, but you got better at what you love.") },
    ],
  },
  {
    id: "bully", title: "Trouble at school", when: (s) => s.education === "in school" && s.age <= 17,
    text: () => "An older kid keeps mocking you in front of everyone.",
    choices: [
      { label: "Tell a teacher", run: (fx, s) => (chance(s, 0.7) ? fx.stat("mood", 4).outcome("The teacher stepped in. It stopped.") : fx.stat("mood", -4).outcome("Nothing changed, and now they call you a snitch.")) },
      { label: "Stand up with words", run: (fx, s) => (chance(s, 0.5) ? fx.stat("reputation", 4).stat("mood", 5).outcome("You landed a sharp comeback. The class laughed with you.") : fx.stat("mood", -5).outcome("It came out wrong. Awkward.")) },
      { label: "Ignore it", run: (fx) => fx.stat("mood", -3).outcome("You kept your head down. It faded, slowly.") },
    ],
  },
  {
    id: "dropout", title: "A tempting shortcut", when: (s) => s.education === "in school" && s.age >= 16 && s.career.skill >= 20,
    text: (s) => `Someone says you're good enough to go all-in as a ${s.career.profession === "chess" ? "chess player" : s.career.profession} and leave school.`,
    choices: [
      { label: "Stay in school", run: (fx) => fx.stat("intelligence", 3).rel("family", 3).outcome("You'll finish what you started.") },
      { label: "Leave school to pursue it", run: (fx, s) => { s.education = "dropped out"; return fx.skill(6).stat("intelligence", -4).rel("family", -10).outcome("You left school. No safety net now."); } },
    ],
  },
  // ---------- Family ----------
  {
    id: "dinner", title: "Family dinner", weight: 1.2,
    text: (s) => (west(s) ? "The family gathers around the stove for a stew supper." : "Everyone's home for dinner for once."),
    choices: [
      { label: "Share your plans", run: (fx, s) => (chance(s, 0.65) ? fx.rel("family", 6).stat("mood", 4).outcome("They're proud of you.") : fx.rel("family", -3).outcome("They have doubts. A tense silence follows.")) },
      { label: "Help clean up after", run: (fx) => fx.rel("family", 5).stat("energy", -5).outcome("Small things matter. They noticed.") },
      { label: "Eat fast and leave", run: (fx) => fx.rel("family", -4).skill(1).outcome("More practice time, less family time.") },
    ],
  },
  {
    id: "sibling", title: "Sibling needs help", when: (s) => !!npc(s, "sibling"),
    text: (s) => `${npc(s, "sibling")!.name.split(" ")[0]} asks you for help with something that matters to them.`,
    choices: [
      { label: "Drop everything to help", run: (fx) => fx.rel("sibling", 10).stat("energy", -10).outcome("They won't forget it.") },
      { label: "Lend some money", run: (fx, s) => fx.money(-Math.min(s.money, s.era === "oldwest" ? 5 : 100)).rel("sibling", 6).outcome("It helped them out of a bind.") },
      { label: "Say you're busy", run: (fx) => fx.rel("sibling", -8).outcome("They looked disappointed.") },
    ],
  },
  {
    id: "parent_money", title: "Tight month at home", when: (s) => s.char.background === "struggling" || s.char.background === "single",
    text: () => "Money is tight at home and it's starting to show.",
    choices: [
      { label: "Take an odd job and contribute", run: (fx) => fx.rel("family", 8).stat("energy", -15).stat("reputation", 1).outcome("You pitched in. It meant a lot.") },
      { label: "Spend less on yourself", run: (fx) => fx.stat("mood", -3).rel("family", 4).outcome("You went without, quietly.") },
      { label: "Stay out of it", run: (fx) => fx.rel("family", -3).outcome("You let the adults handle it.") },
    ],
  },
  // ---------- Friends / social ----------
  {
    id: "party", title: "An invitation", when: (s) => s.age >= 14,
    text: (s) => (west(s) ? "There's a barn dance in town Saturday night." : "Your friends are throwing a party Saturday."),
    choices: [
      { label: "Go and have fun", run: (fx) => fx.stat("mood", 8).rel("friend", 6).stat("energy", -8).outcome("A great night. Stories for weeks.") },
      { label: "Go, but leave early", run: (fx) => fx.stat("mood", 3).rel("friend", 3).outcome("Balanced. You still got rest.") },
      { label: "Stay home and train", run: (fx) => fx.skill(2).rel("friend", -4).stat("mood", -2).outcome("Discipline over fun, this time.") },
    ],
  },
  {
    id: "new_friend", title: "Someone new",
    text: () => "You keep running into someone who shares your interests.",
    choices: [
      { label: "Strike up a conversation", run: (fx, s) => { if (s.npcs.filter((n) => n.role === "friend").length < 5) { const { makeNpcSafe } = helpers; s.npcs.push(makeNpcSafe(s, "friend")); } return fx.stat("mood", 5).outcome("You made a new friend."); } },
      { label: "Keep to yourself", run: (fx) => fx.outcome("Maybe another time.") },
    ],
  },
  {
    id: "romance", title: "A spark", when: (s) => s.age >= 17 && !npc(s, "partner"),
    text: (s) => (west(s) ? "At the general store, someone catches your eye and smiles back." : "Someone you've been texting asks if you'd like to get coffee."),
    choices: [
      { label: "Say yes", run: (fx, s) => { if (chance(s, 0.7)) { s.npcs.push(helpers.makeNpcSafe(s, "partner")); return fx.stat("mood", 10).outcome("It went well. You're seeing each other now."); } return fx.stat("mood", -4).outcome("No spark after all."); } },
      { label: "Not right now", run: (fx) => fx.skill(1).outcome("Your focus stays on your goals.") },
    ],
  },
  {
    id: "child", title: "A big conversation", weight: 0.8, when: (s) => s.age >= 24 && s.age <= 45 && (npc(s, "partner")?.relation ?? 0) > 60 && s.npcs.filter((n) => n.role === "child").length < 3,
    text: (s) => `${npc(s, "partner")!.name.split(" ")[0]} brings up starting a family.`,
    choices: [
      { label: "Let's do it", run: (fx, s) => { const c = helpers.makeNpcSafe(s, "child", s.char.lastName); c.age = 0; c.relation = 90; s.npcs.push(c); unlock(s, "Parent"); return fx.stat("mood", 10).money(s.era === "oldwest" ? -20 : -3000).rel("partner", 8).outcome(`${c.name.split(" ")[0]} was born.`); } },
      { label: "Not yet", run: (fx) => fx.rel("partner", -6).outcome("You agreed to revisit it.") },
    ],
  },
  // ---------- Health / misc ----------
  {
    id: "sick", title: "Under the weather",
    text: (s) => (west(s) ? "A fever has been going around the territory, and now you've caught it." : "You've come down with a nasty flu."),
    choices: [
      { label: "Rest properly", run: (fx) => fx.stat("health", 2).skill(-1).outcome("You recovered fully.") },
      { label: (`See a doctor`), run: (fx, s) => fx.money(s.era === "oldwest" ? -3 : -80).stat("health", 5).outcome("Medicine helped. Back on your feet fast.") },
      { label: "Push through it", run: (fx, s) => (chance(s, 0.5) ? fx.skill(2).stat("health", -6).outcome("You kept going, but it lingered.") : fx.stat("health", -12).stat("mood", -5).outcome("Bad idea. You got worse.")) },
    ],
  },
  {
    id: "found", title: "Lucky find",
    text: (s) => (west(s) ? "A coin purse lies in the dust by the hitching post." : "There's a wallet on the bus seat next to you."),
    choices: [
      { label: "Return it", run: (fx, s) => fx.stat("reputation", 3).stat("mood", 4).money(s.era === "oldwest" ? 2 : 20).outcome("The owner was grateful and gave you a small reward.") },
      { label: "Keep it", run: (fx, s) => fx.money(s.era === "oldwest" ? 12 : 150).stat("mood", -2).outcome("Extra money, and a little guilt.") },
    ],
  },
  {
    id: "fitness", title: "Getting in shape", when: (s) => s.age >= 13,
    text: () => "You've been feeling sluggish lately.",
    choices: [
      { label: "Start a routine", run: (fx) => fx.stat("health", 6).stat("energy", -5).outcome("Slow progress, real progress.") },
      { label: "Sleep more", run: (fx) => fx.stat("energy", 10).stat("mood", 3).outcome("You feel rested.") },
      { label: "Ignore it", run: (fx) => fx.stat("health", -2).outcome("Nothing changed.") },
    ],
  },
  {
    id: "job", title: "Part-time work", when: (s) => s.age >= 15 && !canWork(s) && modern(s),
    text: () => "A local café is hiring weekend staff.",
    choices: [
      { label: "Take the job", run: (fx) => fx.money(1200).stat("energy", -10).stat("intelligence", 1).outcome("Your own money for the first time.") },
      { label: "Focus on school and training", run: (fx) => fx.skill(2).outcome("You passed on it.") },
    ],
  },
  {
    id: "invest", title: "An opportunity", when: (s) => canWork(s) && s.money > (s.era === "oldwest" ? 100 : 5000),
    text: (s) => (west(s) ? "A prospector offers you a share in a silver claim." : "A friend pitches an investment that 'can't lose'."),
    choices: [
      { label: "Invest a chunk", run: (fx, s) => { const amt = Math.round(s.money * 0.3); return chance(s, 0.45) ? fx.money(amt * 1.5).stat("mood", 6).outcome("It paid off handsomely.") : fx.money(-amt).stat("mood", -6).outcome("It went bust."); } },
      { label: "Pass", run: (fx) => fx.outcome("Your money stays safe.") },
    ],
  },

  // ---------- Profession: Footballer ----------
  {
    id: "fb_trial", title: "Academy trial", when: isProf("footballer"), weight: 1.5,
    text: (s) => (s.career.level < 2 ? "A scout invites you to a youth academy trial." : "The manager is deciding the starting lineup for a big match."),
    choices: [
      { label: "Play it safe, simple passes", run: (fx, s) => (chance(s, 0.4 + s.career.skill / 200) ? fx.skill(3).stat("reputation", 3).outcome("Steady and reliable. They noticed.") : fx.skill(1).outcome("Solid, but forgettable.")) },
      { label: "Go for spectacular moves", run: (fx, s) => (chance(s, 0.2 + s.career.skill / 120) ? fx.skill(5).stat("reputation", 8).stat("mood", 6).outcome("A highlight goal! Everyone's talking.") : fx.stat("reputation", -3).stat("mood", -4).outcome("You lost the ball twice. Ouch.")) },
      { label: "Focus on teamwork", run: (fx) => fx.skill(2).rel("friend", 3).stat("reputation", 2).outcome("Teammates loved playing with you.") },
    ],
  },
  {
    id: "fb_transfer", title: "Transfer interest", when: (s) => isProf("footballer")(s) && s.career.level >= 3,
    text: () => "A bigger club wants you, but you'd sit on the bench at first.",
    choices: [
      { label: "Move for the bigger club", run: (fx) => fx.money(20000).stat("reputation", 6).stat("mood", -3).outcome("Bigger stage, more pressure.") },
      { label: "Stay and lead your team", run: (fx) => fx.stat("reputation", 3).stat("mood", 5).skill(2).outcome("Loyalty earns respect.") },
    ],
  },
  // ---------- Chess ----------
  {
    id: "ch_tourney", title: "Weekend tournament", when: isProf("chess"), weight: 1.5,
    text: () => "A rated tournament is happening this weekend.",
    choices: [
      { label: "Play aggressive openings", run: (fx, s) => (chance(s, 0.3 + s.career.skill / 150) ? fx.skill(4).stat("reputation", 5).outcome("You won with sharp tactics.") : fx.skill(1).stat("mood", -4).outcome("Overextended and lost.")) },
      { label: "Play solid and patient", run: (fx, s) => fx.skill(3).stat("reputation", chance(s, 0.5) ? 3 : 1).outcome("A respectable finish.") },
      { label: "Skip it and study", run: (fx) => fx.skill(2).stat("intelligence", 2).outcome("Hours of opening theory.") },
    ],
  },
  {
    id: "ch_coach", title: "A coach's offer", when: (s) => isProf("chess")(s) && s.career.level >= 1,
    text: () => "A titled player offers paid coaching sessions.",
    choices: [
      { label: "Hire the coach", run: (fx) => fx.money(-500).skill(6).outcome("Your understanding deepened.") },
      { label: "Self-study instead", run: (fx) => fx.skill(2).outcome("Slower, but free.") },
    ],
  },
  // ---------- Boxer ----------
  {
    id: "bx_bout", title: "Sparring offer", when: isProf("boxer"), weight: 1.5,
    text: () => "The gym's coach sets up a sparring session with a tougher opponent.",
    choices: [
      { label: "Focus on defense", run: (fx) => fx.skill(3).stat("health", -1).outcome("You learned to read their rhythm.") },
      { label: "Push the pace", run: (fx, s) => (chance(s, 0.3 + s.career.skill / 150) ? fx.skill(4).stat("reputation", 4).outcome("You controlled the session.") : fx.stat("energy", -15).stat("mood", -3).outcome("You ran out of gas.")) },
      { label: "Decline, rest instead", run: (fx) => fx.stat("health", 3).outcome("Recovery matters too.") },
    ],
  },
  {
    id: "bx_promoter", title: "A promoter calls", when: (s) => isProf("boxer")(s) && canWork(s) && s.career.level >= 2,
    text: () => "A promoter offers a headline slot on a local card.",
    choices: [
      { label: "Accept", run: (fx, s) => (chance(s, 0.35 + s.career.skill / 160) ? fx.money(15000).stat("reputation", 10).outcome("A clear points win under the lights.") : fx.money(4000).stat("reputation", -3).outcome("A close loss. Still paid.")) },
      { label: "Hold out for more", run: (fx) => fx.stat("reputation", 1).outcome("You're betting on yourself.") },
    ],
  },
  // ---------- Musician ----------
  {
    id: "mu_gig", title: "Open mic night", when: isProf("musician"), weight: 1.5,
    text: () => "A local venue has an open spot on Friday.",
    choices: [
      { label: "Play your own songs", run: (fx, s) => (chance(s, 0.3 + s.career.skill / 140) ? fx.skill(3).stat("reputation", 6).outcome("People asked for your name afterwards.") : fx.stat("mood", -4).outcome("Polite applause. Back to writing.")) },
      { label: "Play crowd favourites", run: (fx) => fx.stat("reputation", 3).stat("mood", 4).outcome("The room sang along.") },
      { label: "Not ready yet", run: (fx) => fx.skill(2).outcome("More hours in the practice room.") },
    ],
  },
  {
    id: "mu_band", title: "Band invitation", when: (s) => isProf("musician")(s) && s.age >= 15,
    text: () => "Some musicians you know ask you to join their band.",
    choices: [
      { label: "Join them", run: (fx) => fx.rel("friend", 5).skill(2).stat("reputation", 3).outcome("Rehearsals are chaotic and fun.") },
      { label: "Stay solo", run: (fx) => fx.skill(3).outcome("Your sound stays your own.") },
    ],
  },
  // ---------- Artist ----------
  {
    id: "ar_fair", title: "Local art fair", when: isProf("artist"), weight: 1.5,
    text: () => "There's a booth available at the town art fair.",
    choices: [
      { label: "Show experimental work", run: (fx, s) => (chance(s, 0.25 + s.career.skill / 130) ? fx.stat("reputation", 7).money(300).outcome("A critic wrote about you.") : fx.stat("mood", -3).outcome("People walked past.")) },
      { label: "Show crowd-pleasing pieces", run: (fx) => fx.money(200).stat("reputation", 2).outcome("A few sales.") },
      { label: "Just visit and learn", run: (fx) => fx.skill(2).stat("intelligence", 1).outcome("You filled a sketchbook with ideas.") },
    ],
  },
  {
    id: "ar_school", title: "Art school", when: (s) => isProf("artist")(s) && s.age >= 17 && s.age <= 22 && !s.achievements.includes("Art school"),
    text: () => "You've been offered a place at an art program.",
    choices: [
      { label: "Enroll", run: (fx, s) => { unlock(s, "Art school"); return fx.money(-2000).skill(7).stat("intelligence", 3).outcome("Mentors, critiques, growth."); } },
      { label: "Stay self-taught", run: (fx) => fx.skill(2).outcome("You'll learn your own way.") },
    ],
  },
  // ---------- Cowboy ----------
  {
    id: "cb_drive", title: "Cattle drive", when: isProf("cowboy"), weight: 1.6,
    text: () => "A trail boss is hiring hands for a long drive north.",
    choices: [
      { label: "Sign on for the drive", run: (fx, s) => fx.money(randInt(s, 25, 45)).skill(4).stat("health", -4).stat("energy", -10).outcome("Months of dust and stars. You came back tougher.") },
      { label: "Stay and work the ranch", run: (fx) => fx.money(12).skill(2).rel("family", 3).outcome("Steady work, close to home.") },
    ],
  },
  {
    id: "cb_horse", title: "A wild horse", when: isProf("cowboy"),
    text: () => "A mustang has been spotted near the creek. Folks say no one can ride it.",
    choices: [
      { label: "Spend weeks gentling it", run: (fx, s) => (chance(s, 0.4 + s.career.skill / 150) ? fx.skill(5).stat("reputation", 6).outcome("The horse trusts you now. People talk.") : fx.stat("health", -5).outcome("It threw you. Bruised pride.")) },
      { label: "Leave it be", run: (fx) => fx.outcome("Some things are meant to run free.") },
    ],
  },
  {
    id: "cb_town", title: "Trouble in town", when: (s) => isProf("cowboy")(s) && s.age >= 16,
    text: () => "A drifter is picking quarrels at the saloon, and folks look to you.",
    choices: [
      { label: "Talk him down", run: (fx, s) => (chance(s, 0.6) ? fx.stat("reputation", 6).outcome("Calm words won the day.") : fx.stat("mood", -3).outcome("He sneered and left. Didn't go great.")) },
      { label: "Fetch the sheriff", run: (fx) => fx.stat("reputation", 2).outcome("Proper and sensible.") },
      { label: "Mind your business", run: (fx) => fx.stat("reputation", -2).outcome("You finished your sarsaparilla.") },
    ],
  },
];

// Late-bound helpers to avoid circular-import timing issues.
import { makeNpc } from "./engine";
const helpers = {
  makeNpcSafe: (s: GameState, role: "friend" | "partner" | "child", last?: string) => {
    const n = makeNpc(s, role, role === "child" ? 0 : Math.max(13, s.age + randInt(s, -2, 2)), last);
    n.relation = randInt(s, 55, 75);
    return n;
  },
};