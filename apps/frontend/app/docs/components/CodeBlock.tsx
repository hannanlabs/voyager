import { codeToHtml } from "shiki";

interface CodeBlockProps {
  code: string;
  language: string;
  filename?: string;
}

export default async function CodeBlock({
  code,
  language,
  filename,
}: CodeBlockProps) {
  const html = await codeToHtml(code.trim(), {
    lang: language,
    theme: "github-dark-default",
  });

  return (
    <div className="bg-white/5 border border-white/[0.08] rounded-2xl overflow-hidden">
      {filename && (
        <div className="bg-white/5 border-b border-white/10 px-4 py-2.5">
          <span className="font-mono text-xs text-gray-400">{filename}</span>
        </div>
      )}
      <div
        className="p-4 text-sm font-mono overflow-x-auto [&_pre]:!bg-transparent [&_code]:!bg-transparent"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
