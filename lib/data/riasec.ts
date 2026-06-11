import type { RiasecKey } from "../interests";

// O*NET Mini Interest Profiler (Mini-IP): 30 items, five per RIASEC scale,
// public domain (U.S. Department of Labor). Item wording is verbatim from
// Rounds, Wee, Cao, Song & Lewis, "Development of an O*NET Mini Interest
// Profiler (Mini-IP) for Mobile Devices: Psychometric Characteristics"
// (National Center for O*NET Development), Tables 2a–2f. Scale alphas
// .70–.75; correlations with the 60-item Short-IP .95–.96.

export interface RiasecItem { t: string; k: RiasecKey }

export const RIASEC_LABELS: Record<RiasecKey, { name: string; gloss: string; world: string }> = {
  R: { name: "Realistic", gloss: "Builders", world: "hands-on work with things, machines, and the physical world" },
  I: { name: "Investigative", gloss: "Thinkers", world: "analysis, research, and figuring out how things work" },
  A: { name: "Artistic", gloss: "Creators", world: "original expression — designing, writing, composing, performing" },
  S: { name: "Social", gloss: "Helpers", world: "teaching, developing, and caring for people" },
  E: { name: "Enterprising", gloss: "Persuaders", world: "leading, selling, and building ventures" },
  C: { name: "Conventional", gloss: "Organizers", world: "structure, data, and keeping systems in order" },
};

export const RIASEC_ITEMS: RiasecItem[] = [
  // Realistic
  { t: "Build kitchen cabinets", k: "R" },
  { t: "Repair household appliances", k: "R" },
  { t: "Assemble electronic parts", k: "R" },
  { t: "Drive a truck to deliver packages to offices and homes", k: "R" },
  { t: "Test the quality of parts before shipment", k: "R" },
  // Investigative
  { t: "Develop a new medicine", k: "I" },
  { t: "Study ways to reduce water pollution", k: "I" },
  { t: "Conduct chemical experiments", k: "I" },
  { t: "Examine blood samples using a microscope", k: "I" },
  { t: "Develop a way to better predict the weather", k: "I" },
  // Artistic
  { t: "Write books or plays", k: "A" },
  { t: "Compose or arrange music", k: "A" },
  { t: "Create special effects for movies", k: "A" },
  { t: "Paint sets for plays", k: "A" },
  { t: "Write scripts for movies or television shows", k: "A" },
  // Social
  { t: "Help people with personal or emotional problems", k: "S" },
  { t: "Give career guidance to people", k: "S" },
  { t: "Perform rehabilitation therapy", k: "S" },
  { t: "Do volunteer work at a non-profit organization", k: "S" },
  { t: "Teach a high-school class", k: "S" },
  // Enterprising
  { t: "Manage a department within a large company", k: "E" },
  { t: "Start your own business", k: "E" },
  { t: "Negotiate business contracts", k: "E" },
  { t: "Market a new line of clothing", k: "E" },
  { t: "Sell merchandise at a department store", k: "E" },
  // Conventional
  { t: "Load computer software into a large computer network", k: "C" },
  { t: "Operate a calculator", k: "C" },
  { t: "Keep shipping and receiving records", k: "C" },
  { t: "Inventory supplies using a hand-held computer", k: "C" },
  { t: "Stamp, sort, and distribute mail for an organization", k: "C" },
];
