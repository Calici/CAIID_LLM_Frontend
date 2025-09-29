"use client";

import MarkdownRenderer from "react-markdown-renderer";

const markdown = `# This is a H1  
## This is a H2  
###### This is a H6`;

export default function MarkdownTest() {
  return (
    <div className="p-4">
      <h2 className="mb-2 text-sm font-semibold">Markdown Renderer Test</h2>
      <div className="prose max-w-none">
        <MarkdownRenderer markdown={markdown} />
      </div>
    </div>
  );
}
