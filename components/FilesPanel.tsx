"use client";

import { Card, CardBody } from "@heroui/card";
import { ScrollShadow } from "@heroui/scroll-shadow";

const sampleFiles = [
  "report.pdf",
  "notes.txt",
  "presentation.pptx",
  "image.png",
  "src/",
  "report.pdf",
  "notes.txt",
  "presentation.pptx",
  "image.png",
  "src/",
    "report.pdf",
  "notes.txt",
  "presentation.pptx",
  "image.png",
  "src/",
    "report.pdf",
  "notes.txt",
  "presentation.pptx",
  "image.png",
  "src/",

];

export default function FilesPanel() {
  return (
    <div className="flex flex-col min-h-0 h-full">
      <h2 className="text-sm font-semibold mb-3 p-3 border-b">Files</h2>
      <ScrollShadow className="flex-1 min-h-0 overflow-auto px-3 space-y-2">
        {sampleFiles.map((file, idx) => (
          <div
            key={idx}
            className="flex items-center px-2 py-1 rounded-lg hover:bg-default-100 cursor-pointer"
          >
            <span className="text-sm truncate">{file}</span>
          </div>
        ))}
      </ScrollShadow>
    </div>
  );
}
