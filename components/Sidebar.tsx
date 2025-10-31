"use client";

import React, { useState, useMemo, useCallback, ChangeEvent } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear, faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { type WorkspaceSummary } from "@/app/api/wrappers";
import SafeButton from "./safebutton/safebutton";
import { cn } from "@/lib/utils";

type SidebarProps = {
  onSelectWorkspace: (uuid: string | null) => void;
  workSpaces: WorkspaceSummary[];
  activeUuid: string | null;
  onRenameWorkspace: (uuid: string, name: string) => Promise<any> | void;
  onDeleteWorkspace: (uuid: string) => Promise<any> | void;
  onOpenConfig: () => void;
};

export default function Sidebar({
  onSelectWorkspace,
  workSpaces,
  activeUuid,
  onRenameWorkspace,
  onDeleteWorkspace,
  onOpenConfig,
}: SidebarProps) {
  const [filter, setFilter] = useState("");
  const isLoading = false;
  const loadErrorMsg: string | null = null;

  const filtered = useMemo(
    () =>
      workSpaces.filter((w) =>
        w.name.toLowerCase().includes(filter.toLowerCase()),
      ),
    [workSpaces, filter],
  );
  // }
  //──────────────────────────────────────────────────────────────────────────
  // Remove / Delete topics
  //──────────────────────────────────────────────────────────────────────────
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");

  const handleFilterChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setFilter(event.target.value);
    },
    [setFilter],
  );

  const handleNewTopic = useCallback(() => {
    setFilter("");
    onSelectWorkspace(null);
  }, [onSelectWorkspace, setFilter]);

  const handleRenameCancel = useCallback(() => {
    setEditingId(null);
    setRenameDraft("");
  }, [setEditingId, setRenameDraft]);

  const handleRenameSave = useCallback(() => {
    if (!editingId) return Promise.resolve(null);
    const trimmed = renameDraft.trim();
    if (!trimmed) return Promise.resolve(null);
    return Promise.resolve(onRenameWorkspace(editingId, trimmed)).then(() => {
      setEditingId(null);
      setRenameDraft("");
    });
  }, [editingId, renameDraft, onRenameWorkspace, setEditingId, setRenameDraft]);

  const handleDeleteCancel = useCallback(() => {
    setDeletingId(null);
  }, [setDeletingId]);

  const handleDeleteConfirm = useCallback(() => {
    if (!deletingId) return Promise.resolve(null);
    return Promise.resolve(onDeleteWorkspace(deletingId)).then(() => {
      setDeletingId(null);
    });
  }, [deletingId, onDeleteWorkspace, setDeletingId]);

  const handleSettingsOpen = useCallback(() => {
    onOpenConfig();
  }, [onOpenConfig]);

  const buildDeleteModalCancel = useCallback(
    (close: () => void) => () => {
      handleDeleteCancel();
      close();
    },
    [handleDeleteCancel],
  );

  const buildSelectWorkspaceHandler = useCallback(
    (uuid: string) => () => {
      onSelectWorkspace(uuid);
    },
    [onSelectWorkspace],
  );

  const buildRenameStartHandler = useCallback(
    (workspace: WorkspaceSummary) => () => {
      setEditingId(workspace.uuid);
      setRenameDraft(workspace.name);
    },
    [setEditingId, setRenameDraft],
  );

  const buildDeleteRequestHandler = useCallback(
    (uuid: string) => () => {
      setDeletingId(uuid);
    },
    [setDeletingId],
  );

  //──────────────────────────────────────────────────────────────────────────
  // LLM Server Update settings
  //──────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col w-full">
      <div className="p-4 border-b border-surface-strong">
        <h2 className="font-semibold">Topics</h2>
        <div className="mt-3">
          <Input
            size="sm"
            placeholder="Search topics"
            value={filter}
            onChange={handleFilterChange}
          />
        </div>
        <div className="mt-3">
          <Button
            size="sm"
            color="primary"
            radius="sm"
            className="w-full"
            variant="flat"
            onPress={handleNewTopic}
            disableRipple
          >
            New topic
          </Button>
        </div>
      </div>
      <div className="flex flex-col flex-1 w-full">
        {isLoading && <p className="text-xs text-muted-400">Loading…</p>}
        {!isLoading && loadErrorMsg && (
          <p className="text-xs text-danger-500">Failed: {loadErrorMsg}</p>
        )}
        {!isLoading && !loadErrorMsg && filtered.length === 0 && (
          <p className="text-xs text-muted-300">No topics found</p>
        )}
        <ul className="flex flex-col w-full">
          {filtered.map((w) => (
            <li
              key={w.uuid}
              className="w-full flex flex-row  hover:bg-primary-400 px-4 py-2 data-[active=true]:text-white  data-[active=true]:bg-primary-400"
              data-active={w.uuid == activeUuid}
            >
              <div
                className="flex items-center gap-2 aria-hidden:hidden"
                aria-hidden={editingId !== w.uuid}
              >
                <Input
                  size="sm"
                  value={renameDraft}
                  onValueChange={setRenameDraft}
                  className="flex-1"
                  autoFocus
                />
                <SafeButton
                  size="sm"
                  color="primary"
                  isDisabled={!renameDraft.trim()}
                  onPress={handleRenameSave}
                >
                  Save
                </SafeButton>
                <Button
                  size="sm"
                  variant="light"
                  onPress={handleRenameCancel}
                  disableRipple
                >
                  Cancel
                </Button>
              </div>
              <div
                className="flex items-center w-full aria-hidden:hidden"
                aria-hidden={editingId === w.uuid}
              >
                <div
                  onClick={() => onSelectWorkspace(w.uuid)}
                  className="flex-1 whitespace-nowrap text-ellipsis h-full"
                >
                  <p>{w.name.slice(0, 30)}</p>
                </div>
                <div className="flex flex-row gap-x-2 w-fit">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    aria-label="Rename"
                    onPress={buildRenameStartHandler(w)}
                    disableRipple
                  >
                    <FontAwesomeIcon icon={faPen} />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    aria-label="Delete"
                    color="danger"
                    onPress={buildDeleteRequestHandler(w.uuid)}
                    disableRipple
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="p-0 border-t border-surface-strong">
        <Button
          variant="light"
          radius="none"
          className="w-full h-12 justify-start"
          onPress={handleSettingsOpen}
          aria-label="Open Settings"
          disableRipple
        >
          <span className="flex items-center gap-2">
            <FontAwesomeIcon icon={faGear} size="lg" />
          </span>
          <span className="text-lg text-muted-700">Settings</span>
        </Button>
      </div>

      {/* Delete  Modal Here */}
      <Modal isOpen={!!deletingId} onOpenChange={handleDeleteCancel}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="text-sm">Delete workspace</ModalHeader>
              <ModalBody>
                <p className="text-sm">
                  This action cannot be undone. Continue?
                </p>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="default"
                  onPress={buildDeleteModalCancel(onClose)}
                  disableRipple
                >
                  Cancel
                </Button>
                <SafeButton color="danger" onPress={handleDeleteConfirm}>
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
