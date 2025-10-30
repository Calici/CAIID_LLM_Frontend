"use client";
import React, { useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { faUpload, faFile } from "@fortawesome/free-solid-svg-icons";
import {
  agentSummariseFile,
  fsConfirmUpload,
  fsTempUpload,
} from "@/app/api/wrappers";
import SafeButton from "./safebutton/safebutton";
import { Input } from "@heroui/input";
import { fsList, type FileRow } from "@/app/api/wrappers";
// const sampleFiles = ["report.pdf","report.pdf","report.pdf","report.pdf","report.pdf","report.pdf","report.pdf","report.pdf","report.pdf","report.pdf","report.pdf","report.pdf","report.pdf","report.pdf","report.pdf","report.pdf","report.pdf","report.pdf","report.pdf","report.pdf","report.pdf","report.pdf","report.pdf","report.pdf",];

export default function FilesPanel() {
  // File renew related
  const [files, setFiles] = React.useState<FileRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const fetchFiles = React.useCallback(async () => {
    try {
      setLoading(true);
      setErr(null);
      const list = await fsList(); // ← 실제 API 호출
      setFiles(list);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load files");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchFiles(); // ← 마운트 시 1회 호출
    console.log(`files : ${files}`);
  }, [fetchFiles]);

  // File Upload related
  const [FileUploadModalOpen, setFileUploadModalOpen] = useState(false);
  const [uploadedFileName, setUploadedFileName] = React.useState<string | null>(
    null
  );
  const [uuid, setUuid] = React.useState<string | null>(null);
  const [summary, setSummary] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [needsRename, setNeedsRename] = React.useState(false);
  const [proposedName, setProposedName] = React.useState<string | null>(null);

  const handleUpload = React.useCallback(
    //Temp Upload
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files === null) return;
      setUploadedFileName(files[0].name);
      fsTempUpload(files[0].name, files[0])
        .then(({ uuid }) => {
          setUuid(uuid);
          return agentSummariseFile(uuid);
        })
        .then(setSummary);
    },
    []
  );

  const handleConfirmUpload = React.useCallback(() => {
    //Confirm Upload
    if (uuid === null || summary === null || uploadedFileName === null)
      return Promise.resolve(null);
    console.log(`filename: ${uploadedFileName}`);
    return fsConfirmUpload(uuid, { name: uploadedFileName, summary })
      .then(() => {
        fetchFiles();
      })
      .catch((e) => {
        if (e?.response?.status === 409 || e?.status === 409) {
          setNeedsRename(true);
          setProposedName(uploadedFileName);
          return null;
        }
        throw e;
      });
  }, [uuid, summary, uploadedFileName]);

  const handleClear = React.useCallback(() => {
    //Clear Btn
    setUploadedFileName(null);
    setUuid(null);
    setSummary(null);
    setNeedsRename(false);
  }, []);

  return (
    <div className="h-1/3 flex-1">
      <div className="flex flex-col h-full min-h-0 w-full">
        <div className="flex flex-row items-center gap-3 p-3 border-b justify-between w-full">
          <h2 className="text-sm font-semibold">Files</h2>
          <p className="bg-red-600">
            <Button
              endContent={<FontAwesomeIcon icon={faUpload} />}
              onPress={() => setFileUploadModalOpen(true)}
            >
              Upload File
            </Button>
          </p>
        </div>
        <ScrollShadow className="flex-1 overflow-auto max-h-full px-3 space-y-2">
          {loading && <div className="text-sm text-gray-500">Loading...</div>}
          {err && <div className="text-sm text-danger">Error: {err}</div>}
          {!loading && !err && files.length === 0 && (
            <div className="text-sm text-gray-500">No files yet</div>
          )}
          {files.map((f) => (
            <div
              key={f.uuid} // ← uuid로 key
              className="flex items-center justify-between gap-3 px-2 py-2 rounded-lg hover:bg-default-100 cursor-pointer"
              title={f.summary}
            >
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{f.name}</div>
                {f.summary && (
                  <div className="text-xs text-gray-600 line-clamp-2">
                    {f.summary}
                  </div>
                )}
              </div>
            </div>
          ))}
        </ScrollShadow>
      </div>

      {/*// ----------------------------------------
        // File Upload Modal 
        //----------------------------------------*/}
      <Modal
        isOpen={FileUploadModalOpen}
        onOpenChange={setFileUploadModalOpen}
        placement="center"
      >
        <ModalContent>
          {(
            onClose // ← Heroui의 render-prop 패턴
          ) => (
            <>
              <ModalHeader className="text-sm">File Upload</ModalHeader>
              <ModalBody>
                <p className="text-sm">Select the file to upload.</p>
                <input
                  type="file"
                  id="fileUploadId"
                  className="hidden"
                  onChange={(e) => handleUpload(e)}
                ></input>
                <Button
                  endContent={<FontAwesomeIcon icon={faFile} />}
                  as="label"
                  htmlFor="fileUploadId"
                >
                  Select File
                </Button>
                <div className="flex flex-col bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-sm font-medium text-gray-800">
                    Uploaded File:{" "}
                    <span className="ml-2 text-gray-700">
                      {uploadedFileName || "No file Selected"}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">
                    {summary || "[ File Summary ]"}
                  </p>
                </div>
              </ModalBody>
              {/* in case of Duplicate filename (409) */}
              {needsRename && (
                <div className="border border-amber-200 bg-amber-50 p-3">
                  <p className="text-sm font-medium text-amber-900">
                    Same file exists. Please Rename :
                  </p>
                  <div className="flex items-center gap-2">
                    <Input
                      size="sm"
                      value={proposedName ?? ""}
                      onValueChange={setProposedName}
                      aria-label="New File Name"
                    />
                    <Button
                      size="sm"
                      onPress={() => {
                        if (!uuid || !summary) return;

                        // 1) Update new filename to session value
                        setUploadedFileName(proposedName);
                        console.log(
                          `filename: ${uploadedFileName}, proposedName:${proposedName}, summary:${summary}`
                        );
                      }}
                    >
                      OK
                    </Button>
                  </div>
                </div>
              )}
              <ModalFooter>
                <Button
                  color="danger"
                  onPress={() => {
                    handleClear();
                  }}
                >
                  Clear
                </Button>
                <SafeButton color="primary" onPress={handleConfirmUpload}>
                  Save
                </SafeButton>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
