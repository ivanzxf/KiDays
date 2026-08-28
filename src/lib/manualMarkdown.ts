/** 用戶手冊 Markdown 的區塊型別（只支援條款文件會用到的格式）。 */
export type ManualBlock =
  | { type: 'title'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'listItem'; text: string }
  | { type: 'paragraph'; text: string };

/** 把純 Markdown 文字拆成可渲染的區塊。 */
export function parseManual(markdown: string): ManualBlock[] {
  const blocks: ManualBlock[] = [];
  for (const rawLine of markdown.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith('# ')) {
      blocks.push({ type: 'title', text: line.slice(2).trim() });
    } else if (line.startsWith('## ')) {
      blocks.push({ type: 'heading', text: line.slice(3).trim() });
    } else if (line.startsWith('- ')) {
      blocks.push({ type: 'listItem', text: line.slice(2).trim() });
    } else {
      blocks.push({ type: 'paragraph', text: line });
    }
  }
  return blocks;
}
