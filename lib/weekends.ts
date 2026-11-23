// Upcoming weekends, with Indian long weekends flagged.
// Holidays (checked Nov 2026): Christmas Fri 25 Dec 2026, New Year Fri 1 Jan 2027,
// Republic Day Tue 26 Jan 2027, Good Friday 26 Mar 2027.

export type Weekend = {
  id: string; // Saturday ISO date, e.g. 2026-12-26
  label: string; // "Fri 25 Dec – Sun 27 Dec"
  nights: number;
  tag?: string;
  startISO: string;
  endISO: string;
  month: number; // 0-11 of the Saturday
};

const HOLIDAYS: Record<string, string> = {
  "2026-12-25": "Christmas",
  "2027-01-01": "New Year",
  "2027-01-26": "Republic Day",
  "2027-03-26": "Good Friday",
};

const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
};
const fmt = (d: Date) =>
  d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

export function upcomingWeekends(count = 12, from = new Date()): Weekend[] {
  // Start from today's date in IST.
  const ist = new Date(from.getTime() + 5.5 * 3600 * 1000);
  let d = new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()));
  // move to the next Saturday (on Sat/Sun this weekend is already underway, so start next week)
  const dow = d.getUTCDay();
  d = addDays(d, dow === 6 ? 7 : 6 - dow);

  const out: Weekend[] = [];
  for (let i = 0; i < count; i++) {
    const sat = addDays(d, i * 7);
    let start = addDays(sat, -1); // Friday night departure
    let end = addDays(sat, 1); // Sunday
    let nights = 2;
    let tag: string | undefined;

    const fri = iso(addDays(sat, -1));
    const mon = iso(addDays(sat, 2));
    const tue = iso(addDays(sat, 3));
    const thu = iso(addDays(sat, -2));
    if (HOLIDAYS[fri]) {
      start = addDays(sat, -2);
      nights = 3;
      tag = `${HOLIDAYS[fri]} long weekend`;
    } else if (HOLIDAYS[mon]) {
      end = addDays(sat, 2);
      nights = 3;
      tag = `${HOLIDAYS[mon]} long weekend`;
    } else if (HOLIDAYS[tue]) {
      end = addDays(sat, 3);
      nights = 4;
      tag = `${HOLIDAYS[tue]} · take Mon off = 4 days`;
    } else if (HOLIDAYS[thu]) {
      start = addDays(sat, -3);
      nights = 4;
      tag = `${HOLIDAYS[thu]} · take Fri off = 4 days`;
    }
    out.push({
      id: iso(sat),
      label: `${fmt(start)} – ${fmt(end)}`,
      nights,
      tag,
      startISO: iso(start),
      endISO: iso(end),
      month: sat.getUTCMonth(),
    });
  }
  return out;
}
