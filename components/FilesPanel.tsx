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

type FilesPanelProps = {
   onHttpError?: (err: { response?: { status?: number }; status?: number }) => void;
}

export default function FilesPanel({onHttpError}:FilesPanelProps) {
  const [files, setFiles] = React.useState<FileRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
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
      setUploading(true);
      fsTempUpload(files[0].name, files[0])
        .then(({ uuid }) => {
          setUuid(uuid);
          return agentSummariseFile(uuid);
        })
        .then(setSummary)
        .catch((e:any) => {
          const status = e?.response?.status ?? e?.status ?? 0;
          onHttpError?.({ status });
        })
        .finally(() => {
          setUploading(false);
        });
    },
    [onHttpError]
  );

  const handleConfirmUpload = React.useCallback((onClose: () => void) => {
    if (uuid === null || summary === null || uploadedFileName === null)
      return Promise.resolve(null);
    return fsConfirmUpload(uuid, { name: uploadedFileName, summary })
      .then(() => {
        fetchFiles();
        onClose();
        handleClear();
      })
      .catch((e) => {
        if (e?.response?.status === 409 || e?.status === 409) {
          setNeedsRename(true);
          setProposedName(uploadedFileName);
          return null;
        }
        const status = e?.response?.status ?? e?.status ?? 0;
        onHttpError?.({ status });
        return null;
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
          <h2 className="text-lg font-semibold">업로드된 파일들</h2>
          <p>
            <Button
              color="primary"
              endContent={<FontAwesomeIcon icon={faUpload} />}
              onPress={() => setFileUploadModalOpen(true)}
              disableRipple
            >
              새 파일 업로드
            </Button>
          </p>
        </div>
        <ScrollShadow className="flex-1 overflow-auto max-h-full px-3 space-y-2">
          {loading && <div className="text-sm text-muted-400">파일 로딩 중...</div>}
          {err && <div className="text-sm text-danger-500">에러: {err}</div>}
          {!loading && !err && files.length === 0 && (
            <div className="text-sm py-2 text-muted-400">업로드된 파일들이 없습니다.</div>
          )}
          {files.map((f) => (
            <div
              key={f.uuid} // ← uuid로 key
              className="flex items-center justify-between gap-3 px-2 py-2 rounded-lg hover:bg-muted-100 cursor-pointer"
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
              <ModalHeader className="text-sm">파일 업로드</ModalHeader>
              <ModalBody>
                <p className="text-sm">업로드할 파일을 선택해주세요.</p>
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
                  isDisabled={uploading}
                >
                  파일 선택
                </Button>
                <div className="flex flex-col bg-primary-50 rounded-lg p-3 border border-primary-200">
                  <p className="text-sm font-medium text-primary-700">
                    업로드된 파일:{" "}
                    <span className="ml-2 text-primary-600">
                      {uploadedFileName || "파일이 선택되지 않았습니다."}
                    </span>
                  </p>
                  <p className="text-sm text-primary-500">
                    {summary || "[ 파일 요약이 여기 표시됩니다. ]"}
                  </p>
                </div>
              </ModalBody>
              {/* in case of Duplicate filename (409) */}
              {needsRename && (
                <div className="border border-warning-200 bg-warning-50 p-3">
                  <p className="text-sm font-medium text-warning-700">
                    같은 이름의 파일이 존재합니다, 파일명을 수정해주세요 :
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
                  isDisabled={uploading}
                >
                  삭제
                </Button>
                <SafeButton color="primary" onPress={() => handleConfirmUpload(onClose)} isDisabled={uploading}>
                  저장
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
              <ModalHeader className="text-sm">파일 삭제</ModalHeader>
              <ModalBody>
                <p className="text-sm">
                  정말 파일 <b>{confirmDelete?.name}을(를) 삭제합니까?</b>
                </p>
              </ModalBody>
              <ModalFooter>
                <Button onPress={onClose} disableRipple>
                  취소
                </Button>
                <SafeButton
                  color="danger"
                  onPress={handleDeleteConfirmed}
                >
                  삭제
                </SafeButton>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
