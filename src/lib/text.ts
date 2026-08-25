export function foldText(value: string | null | undefined) {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function displayCategory(category: string | null | undefined, name = "") {
  const raw = String(category || "").trim();
  if (raw && raw.toLowerCase() !== "null") return raw;
  const n = foldText(name);
  if (n.includes("instagram") && n.includes("follower")) {
    if (n.includes("old account") || n.includes("mix")) {
      return "Instagram Followers [ Old accounts ]";
    }
    return "Instagram Followers";
  }
  const cut = String(name || "")
    .normalize("NFKC")
    .split("|")[0]
    .trim();
  return cut || "Uncategorized";
}
