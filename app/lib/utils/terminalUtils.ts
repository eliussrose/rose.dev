/**
 * Resolves a cd target path relative to the current working directory.
 * Works in both browser and Node environments (no path module dependency).
 */
export function resolveTerminalPath(cwd: string, target: string): string {
  // Absolute path — return as-is (normalize slashes)
  if (target.startsWith("/")) {
    return normalizePath(target);
  }

  // Home directory shorthand
  if (target === "~" || target.startsWith("~/")) {
    // In a browser context we can't know the real home dir, so treat ~ as root
    const rest = target.slice(1);
    return normalizePath("/" + rest);
  }

  const parts = cwd.split("/").filter(Boolean);

  for (const segment of target.split("/")) {
    if (segment === "" || segment === ".") {
      continue;
    } else if (segment === "..") {
      parts.pop();
    } else {
      parts.push(segment);
    }
  }

  return "/" + parts.join("/");
}

function normalizePath(p: string): string {
  const parts = p.split("/").filter(Boolean);
  const resolved: string[] = [];
  for (const seg of parts) {
    if (seg === "..") {
      resolved.pop();
    } else if (seg !== ".") {
      resolved.push(seg);
    }
  }
  return "/" + resolved.join("/");
}

/**
 * Truncates output to the last `maxLen` characters, prepending a notice when truncation occurs.
 */
export function truncateOutput(output: string, maxLen: number): string {
  if (output.length <= maxLen) {
    return output;
  }
  return `[Output truncated — showing last ${maxLen} characters]\n` + output.slice(-maxLen);
}
