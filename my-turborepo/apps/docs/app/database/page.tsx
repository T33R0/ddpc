import { promises as fs } from 'fs';
import path from 'path';

export default async function DatabaseSchemaPage() {
  const filePath = path.join(process.cwd(), 'app/database/schema-reference.md');
  const content = await fs.readFile(filePath, 'utf8');

  // Simple markdown to HTML conversion (basic implementation)
  const htmlContent = content
    .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold mb-6">$1</h1>')
    .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-semibold mb-4 mt-8">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 class="text-xl font-medium mb-3 mt-6">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/```mermaid([\s\S]*?)```/g, '<pre class="bg-gray-100 p-4 rounded mb-4"><code>$1</code></pre>')
    .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-4 rounded mb-4"><code>$1</code></pre>')
    .replace(/^(- (.+))$/gm, '<li class="mb-2">$2</li>')
    .replace(/(<li(.+?)<\/li>\n?)+/g, '<ul class="list-disc pl-6 mb-4">$&</ul>')
    .replace(/\n\n/g, '</p><p class="mb-4">')
    .replace(/^([^<].+)$/gm, '<p class="mb-4">$1</p>')
    .replace(/<p class="mb-4"><\/p>/g, '');

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="prose prose-lg max-w-none">
        <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
      </div>
    </div>
  );
}
