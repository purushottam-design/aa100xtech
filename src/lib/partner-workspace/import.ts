import { leadSchema, type LeadInput } from "./domain";

/** RFC4180-style CSV reader with quoted commas/newlines and strict bounds. */
export function parseLeadCsv(input: string) {
  if (input.length > 2_000_000) throw new Error("Use a CSV smaller than 2 MB.");
  const records: string[][] = [];
  let row: string[] = [],
    field = "",
    quoted = false;
  const text = input.replace(/^\uFEFF/, "");
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (quoted || field === "") quoted = !quoted;
      else throw new Error("Invalid CSV quoting.");
    } else if (!quoted && (c === "," || c === "\n" || c === "\r")) {
      row.push(field.trim());
      field = "";
      if (c !== ",") {
        if (row.some(Boolean)) records.push(row);
        row = [];
        if (c === "\r" && text[i + 1] === "\n") i++;
      }
    } else field += c;
    if (records.length > 1000) throw new Error("Import at most 1,000 rows per file.");
  }
  if (quoted) throw new Error("CSV has an unclosed quoted field.");
  row.push(field.trim());
  if (row.some(Boolean)) records.push(row);
  const header = records.shift()?.map((v) => v.toLowerCase().replace(/[\s-]+/g, "_"));
  if (!header || !header.includes("name") || !header.includes("handle"))
    throw new Error("CSV requires name, platform, handle and url columns.");
  const forbidden = [
    "role",
    "user_id",
    "created_by_user_id",
    "assigned_to",
    "approval",
    "status",
    "membership",
  ];
  if (header.some((h) => forbidden.includes(h)))
    throw new Error("Remove role, ownership, assignment and approval columns from the CSV.");
  const rows: { row: number; lead: LeadInput | null; error: string | null }[] = [];
  records.forEach((values, index) => {
    const obj = Object.fromEntries(header.map((key, i) => [key, values[i] ?? ""]));
    const raw = (obj["followers"] ?? "0").toLowerCase().replaceAll(",", "");
    const count = raw.match(/^(\d+(?:\.\d+)?)([km])?$/);
    const followers = count
      ? Math.round(Number(count[1]) * (count[2] === "m" ? 1e6 : count[2] === "k" ? 1e3 : 1))
      : Number.NaN;
    const result = leadSchema.safeParse({
      name: obj["name"],
      email: obj["email"] ?? "",
      phone: obj["phone"] ?? "",
      city: obj["city"] ?? "",
      country: obj["country"] ?? "",
      category: obj["category"] ?? "",
      notes: obj["notes"] ?? "",
      socials: [
        {
          platform: obj["platform"]?.toLowerCase(),
          handle: obj["handle"],
          url: obj["url"] ?? obj["profile_url"],
          followers,
        },
      ],
    });
    rows.push({
      row: index + 2,
      lead: result.success ? result.data : null,
      error: result.success ? null : result.error.issues.map((i) => i.message).join("; "),
    });
  });
  return rows;
}
