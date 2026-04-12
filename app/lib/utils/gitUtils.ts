import type { GitFileStatus } from "../../types";

/**
 * Parses `git status --porcelain` output into an array of GitFileStatus objects.
 *
 * Porcelain format: XY PATH or XY ORIG_PATH -> PATH
 *   X = index (staged) status
 *   Y = working tree status
 */
export function parseGitStatus(porcelain: string): GitFileStatus[] {
  if (!porcelain.trim()) return [];

  const results: GitFileStatus[] = [];

  for (const line of porcelain.split("\n")) {
    if (!line) continue;

    const x = line[0]; // staged status
    const y = line[1]; // unstaged status
    const rest = line.slice(3);

    // Handle renames: "R  old -> new" or "R  old\0new" (porcelain v1 uses space)
    const filePath = rest.includes(" -> ") ? rest.split(" -> ")[1] : rest;

    const staged = x !== " " && x !== "?";
    const rawStatus = staged ? x : y;

    let status: GitFileStatus["status"];
    switch (rawStatus) {
      case "M":
        status = "M";
        break;
      case "A":
        status = "A";
        break;
      case "D":
        status = "D";
        break;
      case "R":
        status = "R";
        break;
      case "?":
        status = "?";
        break;
      default:
        status = "M";
    }

    results.push({ path: filePath.trim(), status, staged });
  }

  return results;
}
