/**
 * Returns the directory path for a spec given its feature name.
 */
export function getSpecDirPath(featureName: string): string {
  return `.kiro/specs/${featureName}/`;
}

/**
 * Toggles a `- [ ]` checkbox to `- [x]` (or vice versa) on the given line index.
 * Returns the full content string with the toggled line.
 */
export function toggleCheckbox(content: string, lineIndex: number): string {
  const lines = content.split("\n");
  if (lineIndex < 0 || lineIndex >= lines.length) {
    return content;
  }

  const line = lines[lineIndex];
  if (line.includes("- [ ]")) {
    lines[lineIndex] = line.replace("- [ ]", "- [x]");
  } else if (line.includes("- [x]")) {
    lines[lineIndex] = line.replace("- [x]", "- [ ]");
  }

  return lines.join("\n");
}
