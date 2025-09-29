"use client";

import { Card, CardBody } from "@heroui/card";
import { ScrollShadow } from "@heroui/scroll-shadow";

const sampleFiles = [
  "report.pdf",
  "notes.txt",
  "presentation.pptx",
  "image.png",
  "src/",
];

export default function FilesPanel() {
  return (
    <Card className="h-full w-full rounded-none border-0">
      <CardBody className="p-4">
        <h2 className="text-sm font-semibold mb-3">Files</h2>
        <ScrollShadow hideScrollBar className="h-full space-y-2">
          {sampleFiles.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center px-2 py-1 rounded-lg hover:bg-default-100 cursor-pointer"
            >
              <span className="text-sm truncate">{file}</span>
            </div>
          ))}
        </ScrollShadow>
      </CardBody>
    </Card>
  );
}
