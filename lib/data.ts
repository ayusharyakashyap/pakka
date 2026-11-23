// All destinations are real goSTOPS cities (gostops.com, Nov 2026).
// Costs are rough per-person backpacker estimates (dorm bed + food + local travel), in INR per day.

export type Vibe =
  | "mountains"
  | "beach"
  | "party"
  | "chill"
  | "adventure"
  | "spiritual"
  | "heritage";

export const VIBES: { id: Vibe; label: string; emoji: string }[] = [
  { id: "mountains", label: "Mountains", emoji: "🏔️" },
  { id: "beach", label: "Beach", emoji: "🏖️" },
  { id: "party", label: "Party", emoji: "🪩" },
  { id: "chill", label: "Cafés & chill", emoji: "☕" },
  { id: "adventure", label: "Adventure", emoji: "🪂" },
  { id: "spiritual", label: "Spiritual", emoji: "🕉️" },
  { id: "heritage", label: "Forts & old cities", emoji: "🏰" },
];

export type Origin = { id: string; name: string; lat: number; lng: number };

export const ORIGINS: Origin[] = [
  { id: "delhi", name: "Delhi NCR", lat: 28.61, lng: 77.21 },
  { id: "mumbai", name: "Mumbai", lat: 19.08, lng: 72.88 },
  { id: "bengaluru", name: "Bengaluru", lat: 12.97, lng: 77.59 },
  { id: "pune", name: "Pune", lat: 18.52, lng: 73.86 },
  { id: "hyderabad", name: "Hyderabad", lat: 17.39, lng: 78.49 },
  { id: "chennai", name: "Chennai", lat: 13.08, lng: 80.27 },
  { id: "kolkata", name: "Kolkata", lat: 22.57, lng: 88.36 },
  { id: "ahmedabad", name: "Ahmedabad", lat: 23.02, lng: 72.57 },
  { id: "jaipur", name: "Jaipur", lat: 26.91, lng: 75.79 },
  { id: "chandigarh", name: "Chandigarh", lat: 30.73, lng: 76.78 },
  { id: "lucknow", name: "Lucknow", lat: 26.85, lng: 80.95 },
  { id: "dehradun", name: "Dehradun", lat: 30.32, lng: 78.03 },
  { id: "indore", name: "Indore", lat: 22.72, lng: 75.86 },
  { id: "bhopal", name: "Bhopal", lat: 23.26, lng: 77.41 },
  { id: "nagpur", name: "Nagpur", lat: 21.15, lng: 79.09 },
  { id: "kochi", name: "Kochi", lat: 9.93, lng: 76.27 },
  { id: "coimbatore", name: "Coimbatore", lat: 11.02, lng: 76.96 },
  { id: "manipal", name: "Manipal / Mangaluru", lat: 13.35, lng: 74.79 },
];

export type Destination = {
  id: string;
  name: string;
  state: string;
  lat: number;
  lng: number;
  hill: boolean;
  vibes: Vibe[];
  daily: number; // INR per person per day
  airportHrs: number; // last-mile hours from nearest airport
  // season score per month Jan..Dec: 1 great, 0.6 ok, 0.2 avoid
  season: number[];
  tagline: string;
  solo: string; // why it works solo
  gostops: string; // goSTOPS city slug
};

const G = 1, O = 0.6, A = 0.2;

export const DESTINATIONS: Destination[] = [
  {
    id: "goa", name: "Goa", state: "Goa", lat: 15.55, lng: 73.76, hill: false,
    vibes: ["beach", "party", "chill"], daily: 2100, airportHrs: 1,
    season: [G, G, O, O, A, A, A, A, A, O, G, G],
    tagline: "The trip your group chat has been 'planning' since 2019.",
    solo: "Hostel crowd is huge. You'll have a scooter gang by day two.",
    gostops: "Goa",
  },
  {
    id: "alibaug", name: "Alibaug", state: "Maharashtra", lat: 18.64, lng: 72.87, hill: false,
    vibes: ["beach", "chill"], daily: 1700, airportHrs: 2.5,
    season: [G, G, O, O, A, A, A, A, O, O, G, G],
    tagline: "Ferry from Mumbai, beach by lunch. Lowest effort sea you'll get.",
    solo: "Short hop, easy to go alone and be back Sunday night.",
    gostops: "Alibaug",
  },
  {
    id: "pondicherry", name: "Pondicherry", state: "Puducherry", lat: 11.93, lng: 79.83, hill: false,
    vibes: ["beach", "chill", "heritage"], daily: 1800, airportHrs: 3,
    season: [G, G, O, O, A, A, O, O, O, O, O, G],
    tagline: "French streets, cafés and an Auroville sunrise.",
    solo: "Cycle-friendly and calm. A great first solo trip.",
    gostops: "Pondicherry",
  },
  {
    id: "kasol", name: "Kasol", state: "Himachal", lat: 32.01, lng: 77.31, hill: true,
    vibes: ["mountains", "party", "chill", "adventure"], daily: 1400, airportHrs: 1.5,
    season: [O, O, G, G, G, G, A, A, O, G, G, O],
    tagline: "Parvati valley, riverside cafés, and a trek to Kheerganga.",
    solo: "Backpacker central. Trek groups form in the hostel common room.",
    gostops: "Kasol",
  },
  {
    id: "bir", name: "Bir", state: "Himachal", lat: 32.04, lng: 76.72, hill: true,
    vibes: ["mountains", "adventure", "chill"], daily: 1500, airportHrs: 2,
    season: [O, O, G, G, G, O, A, A, O, G, G, O],
    tagline: "Paragliding capital of India. Jump off a mountain, then nap.",
    solo: "Everyone's there for the same flight. Instant crew.",
    gostops: "Bir",
  },
  {
    id: "mcleodganj", name: "McLeod Ganj", state: "Himachal", lat: 32.24, lng: 76.32, hill: true,
    vibes: ["mountains", "chill", "spiritual", "adventure"], daily: 1400, airportHrs: 1,
    season: [O, O, G, G, G, G, A, A, O, G, G, O],
    tagline: "Triund trek, Tibetan momos, monastery calm.",
    solo: "Classic solo-backpacker town. Easy to find trek buddies.",
    gostops: "mcleodganj",
  },
  {
    id: "rishikesh", name: "Rishikesh", state: "Uttarakhand", lat: 30.09, lng: 78.27, hill: true,
    vibes: ["adventure", "spiritual", "chill", "mountains"], daily: 1400, airportHrs: 1,
    season: [O, G, G, G, O, O, A, A, O, G, G, O],
    tagline: "Rafting in the morning, Ganga aarti by evening.",
    solo: "Probably India's easiest solo trip. Cafés full of solo travellers.",
    gostops: "Rishikesh",
  },
  {
    id: "mussoorie", name: "Mussoorie", state: "Uttarakhand", lat: 30.46, lng: 78.07, hill: true,
    vibes: ["mountains", "chill"], daily: 1700, airportHrs: 1.5,
    season: [O, O, G, G, G, G, A, A, O, G, G, O],
    tagline: "Mall Road walks, fog, maggi, repeat.",
    solo: "Safe, walkable and close to Dehradun.",
    gostops: "Mussoorie",
  },
  {
    id: "nainital", name: "Nainital", state: "Uttarakhand", lat: 29.39, lng: 79.45, hill: true,
    vibes: ["mountains", "chill"], daily: 1700, airportHrs: 2,
    season: [O, O, G, G, G, G, A, A, O, G, G, O],
    tagline: "Boat on the lake, chai on the ridge.",
    solo: "Compact and easy. Good long-weekend escape from Delhi.",
    gostops: "Nainital",
  },
  {
    id: "katra", name: "Katra", state: "J&K", lat: 32.99, lng: 74.93, hill: true,
    vibes: ["spiritual", "mountains", "adventure"], daily: 1300, airportHrs: 1.5,
    season: [O, O, G, G, G, O, A, A, G, G, G, O],
    tagline: "The Vaishno Devi night trek. 13 km of pure group bonding.",
    solo: "The trek runs all night and is never empty.",
    gostops: "Katra",
  },
  {
    id: "amritsar", name: "Amritsar", state: "Punjab", lat: 31.62, lng: 74.88, hill: false,
    vibes: ["spiritual", "heritage"], daily: 1300, airportHrs: 0.5,
    season: [G, G, G, O, A, A, A, A, O, G, G, G],
    tagline: "Golden Temple at night, kulchas all day, Wagah at sunset.",
    solo: "Langar seats you next to strangers. Very easy alone.",
    gostops: "Amritsar",
  },
  {
    id: "jaipur", name: "Jaipur", state: "Rajasthan", lat: 26.92, lng: 75.82, hill: false,
    vibes: ["heritage", "party"], daily: 1500, airportHrs: 0.5,
    season: [G, G, G, O, A, A, A, A, O, G, G, G],
    tagline: "Forts, rooftop cafés, and a sunset at Nahargarh.",
    solo: "Hostel walking tours make it easy to explore alone.",
    gostops: "Jaipur",
  },
  {
    id: "udaipur", name: "Udaipur", state: "Rajasthan", lat: 24.58, lng: 73.71, hill: false,
    vibes: ["heritage", "chill"], daily: 1600, airportHrs: 0.5,
    season: [G, G, G, O, A, A, O, O, G, G, G, G],
    tagline: "Lakes, palaces, and the best rooftop sunsets in India.",
    solo: "Slow, pretty, and safe. Rooftop cafés are made for solo.",
    gostops: "Udaipur",
  },
  {
    id: "varanasi", name: "Varanasi", state: "Uttar Pradesh", lat: 25.32, lng: 83.01, hill: false,
    vibes: ["spiritual", "heritage"], daily: 1200, airportHrs: 1,
    season: [G, G, G, O, A, A, A, A, O, G, G, G],
    tagline: "Sunrise boat on the Ganga. You'll talk about it for years.",
    solo: "Ghat walks and boat rides pair you up with other travellers fast.",
    gostops: "Varanasi",
  },
  {
    id: "coorg", name: "Coorg", state: "Karnataka", lat: 12.42, lng: 75.74, hill: true,
    vibes: ["mountains", "chill", "adventure"], daily: 1800, airportHrs: 3,
    season: [G, G, O, O, O, A, A, A, O, G, G, G],
    tagline: "Coffee estates, waterfalls, misty mornings.",
    solo: "Quiet and green. Good reset weekend from Bengaluru.",
    gostops: "Coorg",
  },
  {
    id: "chikmagalur", name: "Chikmagalur", state: "Karnataka", lat: 13.32, lng: 75.77, hill: true,
    vibes: ["mountains", "chill", "adventure"], daily: 1700, airportHrs: 3,
    season: [G, G, O, O, O, A, A, A, O, G, G, G],
    tagline: "Mullayanagiri sunrise and endless coffee.",
    solo: "Trek groups make it easy to join in.",
    gostops: "Chikmagalur",
  },
  {
    id: "ooty", name: "Ooty", state: "Tamil Nadu", lat: 11.41, lng: 76.7, hill: true,
    vibes: ["mountains", "chill"], daily: 1700, airportHrs: 3,
    season: [O, G, G, G, G, O, A, A, O, O, O, O],
    tagline: "Toy train, tea gardens, and real sweater weather.",
    solo: "Easy to reach and easy to slow down alone.",
    gostops: "Ooty",
  },
];

export const destById = (id: string) => DESTINATIONS.find((d) => d.id === id);
export const originById = (id: string) => ORIGINS.find((o) => o.id === id);
