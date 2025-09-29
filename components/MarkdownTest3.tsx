import React from 'react'
import {createRoot} from 'react-dom/client'
import Markdown from 'react-markdown'


const markdown = `# This is a H1  

## This is a H2  

###### This is a **H6**

~~asdf~~ 

\`\`\`
public class BootSpringBootApplication {
  public static void main(String[] args) {
    System.out.println("Hello, Honeymon");
  }
}
\`\`\`

1. First
2. Second
3. Third 


`;

export default function MarkdownTest3() {
  return (
    <div className="p-4">
      <h2 className="mb-2 text-sm font-semibold">Markdown Renderer Test</h2>
      <div className="prose max-w-none">
        <Markdown>{markdown}</Markdown>
      </div>
    </div>
  );
}
