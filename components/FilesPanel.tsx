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
import { faUpload, faFile, faTrash } from "@fortawesome/free-solid-svg-icons";
import {
  agentSummariseFile,
  fsConfirmUpload,
  fsTempUpload,
  fsDelete,
} from "@/app/api/wrappers";
import SafeButton from "./safebutton/safebutton";
import { Input } from "@heroui/input";
import { fsList, type FileRow } from "@/app/api/wrappers";

export default function FilesPanel() {
  const [files, setFiles] = React.useState<FileRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const fetchFiles = React.useCallback(() => {
    setLoading(true);
    setErr(null);

    return fsList()
      .then((list) => {
        setFiles(list);
      })
      .catch((e: any) => {
        setErr(e?.message ?? "Failed to load files");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [setErr, setFiles, setLoading]);

  React.useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const [FileUploadModalOpen, setFileUploadModalOpen] = useState(false);
  const [uploadedFileName, setUploadedFileName] = React.useState<string | null>(
    null
  );
  const [uuid, setUuid] = React.useState<string | null>(null);
  const [summary, setSummary] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [needsRename, setNeedsRename] = React.useState(false);
  const [proposedName, setProposedName] = React.useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState<FileRow | null>(
    null
  );

  const handleUpload = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files === null) return;
      setUploadedFileName(files[0].name);
      setSummary(null)
      fsTempUpload(files[0].name, files[0])
        .then(({ uuid }) => {
          setUuid(uuid);
          return agentSummariseFile(uuid);
        })
        .then(setSummary);
    },
    []
  );

  const handleConfirmUpload = React.useCallback((onClose: () => void) => {
    if (uuid === null || summary === null || uploadedFileName === null)
      return Promise.resolve(null);
    return fsConfirmUpload(uuid, { name: uploadedFileName, summary })
      .then(() => {
        fetchFiles();
        onClose()
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
    setUploadedFileName(null);
    setUuid(null);
    setSummary(null);
    setNeedsRename(false);
  }, []);

  const handleDeleteConfirmed = React.useCallback(() => {
    if (!confirmDelete) return Promise.resolve(null);
    return fsDelete(confirmDelete.uuid).then(() => {
      setFiles((prev) => prev.filter((x) => x.uuid !== confirmDelete.uuid));
      setConfirmDelete(null);
    });
  }, [confirmDelete, setFiles, setConfirmDelete]);

  return (
    <div className="h-1/3 flex-1">
      <div className="flex flex-col h-full min-h-0 w-full">
        <div className="flex flex-row items-center gap-3 px-3 py-2 border-b border-surface-strong justify-between w-full">
          <h2 className="text-lg font-semibold">Files</h2>
          <p>
            <Button
              color="primary"
              endContent={<FontAwesomeIcon icon={faUpload} />}
              onPress={() => setFileUploadModalOpen(true)}
              disableRipple
            >
              Upload File
            </Button>
          </p>
        </div>
        <ScrollShadow className="flex-1 overflow-auto max-h-full px-3 space-y-2">
          {loading && <div className="text-sm text-muted-400">Loading...</div>}
          {err && <div className="text-sm text-danger-500">Error: {err}</div>}
          {!loading && !err && files.length === 0 && (
            <div className="text-sm text-muted-400">No files yet</div>
          )}
          {files.map((f) => (
            <div
              key={f.uuid} // ← uuid로 key
              className="flex items-center justify-between gap-3 px-2 py-2 rounded-lg hover:bg-surface-strong cursor-pointer"
              title={f.summary}
            >
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{f.name}</div>
                {f.summary && (
                  <div className="text-xs text-muted-500 line-clamp-2">
                    {f.summary}
                  </div>
                )}
              </div>
              <div className="">
                <Button
                  isIconOnly
                  onPress={() => {
                    setConfirmDelete(f);
                  }}
                  disableRipple
                >
                  <FontAwesomeIcon icon={faTrash} />
                </Button>
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
                  disableRipple
                >
                  Select File
                </Button>
                <div className="flex flex-col bg-primary-50 rounded-lg p-3 border border-primary-200">
                  <p className="text-sm font-medium text-primary-700">
                    Uploaded File:{" "}
                    <span className="ml-2 text-primary-600">
                      {uploadedFileName || "No file Selected"}
                    </span>
                  </p>
                  <p className="text-sm text-primary-500">
                    {summary || "[ File Summary ]"}
                  </p>
                </div>
              </ModalBody>
              {/* in case of Duplicate filename (409) */}
              {needsRename && (
                <div className="border border-warning-200 bg-warning-50 p-3">
                  <p className="text-sm font-medium text-warning-700">
                    Same file exists. Please Rename :
                  </p>
                  <div className="flex items-center gap-2">
                    <Input
                      size="sm"
                      // value={proposedName ?? ""}
                      // onValueChange={setProposedName}
                      value={uploadedFileName || ""}
                      onValueChange={setUploadedFileName}
                      aria-label="New File Name"
                    />
                    {/* <Button
                      size="sm"
                      onPress={() => {
                        if (!uuid || !summary) return;
                        // 1) Update new filename to session value
                        setUploadedFileName(proposedName);
                      }}
                      disableRipple
                    >
                      OK
                    </Button> */}
                  </div>
                </div>
              )}
              <ModalFooter>
                <Button
                  color="danger"
                  onPress={() => {
                    handleClear();
                  }}
                  disableRipple
                >
                  Clear
                </Button>
                <SafeButton color="primary" onPress={() => handleConfirmUpload(onClose)}>
                  Save
                </SafeButton>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={!!confirmDelete}
        onOpenChange={() => setConfirmDelete(null)}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="text-sm">Delete file</ModalHeader>
              <ModalBody>
                <p className="text-sm">
                  Delete <b>{confirmDelete?.name}</b>?
                </p>
              </ModalBody>
              <ModalFooter>
                <Button onPress={onClose} disableRipple>
                  Cancel
                </Button>
                <SafeButton
                  color="danger"
                  onPress={handleDeleteConfirmed}
                >
                  Delete
                </SafeButton>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
