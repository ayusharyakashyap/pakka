import type { Vibe } from "./data";
import type { Weekend } from "./weekends";

export type Commitment = 2 | 1 | 0; // 2 = 100% in, 1 = probably, 0 = don't count on me

export type Member = {
  id: string;
  name: string;
  city: string; // origin id
  budget: number; // INR per person, total trip
  weekends: string[]; // weekend ids
  vibes: Vibe[];
  commitment: Commitment;
  joinedAt: number;
};

export type Plan = {
  id: string;
  name: string;
  organizer: string;
  groupSize: number; // how many people the organizer expects (1 = solo)
  createdAt: number;
  weekends: Weekend[];
  locked?: { destId: string; weekendId: string; at: number };
};

export type MemberFit = {
  memberId: string;
  name: string;
  city: string;
  mode: "same city" | "bus/train" | "flight";
  hours: number;
  cost: number;
  overBudget: boolean;
  vibeMatch: number; // 0..1
  score: number; // 0..1
};

export type DestResult = {
  destId: string;
  score: number; // 0..100
  avgCost: number;
  maxHours: number;
  votes: number;
  reasons: string[];
  fits: MemberFit[];
};

export type Results = {
  weekendCounts: { id: string; count: number; weighted: number }[];
  bestWeekendId: string | null;
  considered: number;
  ranking: DestResult[];
  pakka: number; // 0..100
  verdict: string;
};
