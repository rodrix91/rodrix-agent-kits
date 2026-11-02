/** Safely wrap a kit source file in Markdown, even when it has its own fences.
 *
 * A literal triple-backtick wrapper closes early on source files containing
 * fenced shell examples. Select a delimiter longer than any backtick run in
 * the file, preserving the exact source/preview text.
 */
export function fencedKitContent(content: string, language: 'markdown' | 'json'): string {
  const longest = Math.max(2, ...(content.match(/`+/g) ?? []).map((run) => run.length));
  const fence = '`'.repeat(longest + 1);
  return `${fence}${language}\n${content}\n${fence}`;
}
