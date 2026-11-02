/** Safely wrap a kit source file in Markdown, even when it has its own fences.
 *
 * A literal triple-backtick wrapper closes early on source files containing
 * fenced shell examples. Select a delimiter longer than any backtick run in
 * the file, preserving the exact source/preview text.
 */
export function fencedKitContent(content: string, language: 'markdown' | 'json'): string {
  // Avoid spreading one argument per backtick run into Math.max. Large kit
  // sources with many short runs can exhaust the JS argument stack, even
  // when the required delimiter is only three backticks long.
  let longest = 2;
  let current = 0;
  for (const char of content) {
    if (char === '`') {
      current += 1;
      if (current > longest) longest = current;
    } else {
      current = 0;
    }
  }
  const fence = '`'.repeat(longest + 1);
  return `${fence}${language}\n${content}\n${fence}`;
}
