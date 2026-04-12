/**
 * Estimates the number of tokens in a string using the approximation of 4 characters per token.
 */
export function estimateTokens(s: string): number {
  return Math.ceil(s.length / 4);
}
