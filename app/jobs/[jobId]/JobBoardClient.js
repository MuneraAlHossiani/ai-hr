"use client";

import { useMemo, useRef, useState } from "react";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import CandidateCard from "./CandidateCard";
import styles from "./kanban.module.css";
import boardStyles from "./job-board.module.css";

const COLUMNS = [
  { id: "new", label: "New" },
  { id: "screening", label: "Screening" },
  { id: "interview", label: "Interview" },
  { id: "offer", label: "Offer" },
  { id: "closed", label: "Closed" },
];

export default function JobBoardClient({ jobId, initialCandidates }) {
  const [candidates, setCandidates] = useState(() => {
    const map = {};
    for (const c of initialCandidates) map[c.id] = c;
    return map;
  });
  const [uploading, setUploading] = useState(false);
  const [uploadErrors, setUploadErrors] = useState([]);
  const [actionError, setActionError] = useState("");
  const [hiringId, setHiringId] = useState(null);
  const [pendingIds, setPendingIds] = useState(() => new Set());
  const [showRejected, setShowRejected] = useState(false);
  const fileInputRef = useRef(null);

  const columnCandidates = useMemo(() => {
    const grouped = {};
    for (const col of COLUMNS) grouped[col.id] = [];
    for (const candidate of Object.values(candidates)) {
      if (grouped[candidate.status]) {
        grouped[candidate.status].push(candidate);
      }
    }
    return grouped;
  }, [candidates]);

  const rejectedCandidates = useMemo(
    () => Object.values(candidates).filter((c) => c.status === "rejected"),
    [candidates]
  );

  async function patchStatus(candidateId, status) {
    const res = await fetch(`/api/jobs/${jobId}/candidates/${candidateId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to update candidate status.");
    }
    return data.candidates;
  }

  async function handleDragEnd(result) {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId) return;

    const previousCandidates = candidates;
    const newStatus = destination.droppableId;

    setActionError("");
    setCandidates((prev) => ({
      ...prev,
      [draggableId]: { ...prev[draggableId], status: newStatus },
    }));
    setPendingIds((prev) => new Set(prev).add(draggableId));

    try {
      const updated = await patchStatus(draggableId, newStatus);
      setCandidates(updated);
    } catch (err) {
      setCandidates(previousCandidates);
      setActionError(err.message);
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(draggableId);
        return next;
      });
    }
  }

  async function handleMarkHired(candidateId) {
    setActionError("");
    setHiringId(candidateId);
    const previousCandidates = candidates;

    try {
      const updated = await patchStatus(candidateId, "closed");
      setCandidates(updated);
    } catch (err) {
      setCandidates(previousCandidates);
      setActionError(err.message);
    } finally {
      setHiringId(null);
    }
  }

  async function handleFilesSelected(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    setUploadErrors([]);

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    try {
      const res = await fetch(`/api/jobs/${jobId}/candidates`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setUploadErrors([{ fileName: "Upload", error: data.error || "Upload failed." }]);
      } else {
        if (data.candidates?.length) {
          setCandidates((prev) => {
            const next = { ...prev };
            for (const c of data.candidates) next[c.id] = c;
            return next;
          });
        }
        if (data.errors?.length) {
          setUploadErrors(data.errors);
        }
      }
    } catch {
      setUploadErrors([{ fileName: "Upload", error: "Could not reach the server." }]);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div>
      <div className={boardStyles.uploadRow}>
        <button
          type="button"
          className="btn-primary"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? "Analyzing CVs..." : "Upload CV"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx"
          multiple
          hidden
          onChange={handleFilesSelected}
        />
      </div>

      {uploadErrors.length > 0 && (
        <div className={boardStyles.uploadErrors}>
          {uploadErrors.map((e, i) => (
            <div key={i} className={boardStyles.uploadError}>
              <strong>{e.fileName}:</strong> {e.error}
            </div>
          ))}
        </div>
      )}

      {actionError && <div className={styles.errorBanner}>{actionError}</div>}

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className={styles.board}>
          {COLUMNS.map((col) => (
            <Droppable droppableId={col.id} key={col.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`${styles.column} ${
                    snapshot.isDraggingOver ? styles.columnDraggingOver : ""
                  }`}
                >
                  <div className={styles.columnHeader}>
                    <span>{col.label}</span>
                    <span className={styles.columnCount}>{columnCandidates[col.id].length}</span>
                  </div>

                  {columnCandidates[col.id].length === 0 && (
                    <div className={styles.emptyColumn}>No candidates</div>
                  )}

                  {columnCandidates[col.id].map((candidate, index) => (
                    <CandidateCard
                      key={candidate.id}
                      candidate={candidate}
                      index={index}
                      onMarkHired={handleMarkHired}
                      hiringId={hiringId}
                      isPending={pendingIds.has(candidate.id)}
                    />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      <div className={styles.rejectedSection}>
        <button
          type="button"
          className={styles.rejectedToggle}
          onClick={() => setShowRejected((s) => !s)}
        >
          {showRejected ? "Hide rejected" : "Show rejected"} ({rejectedCandidates.length})
        </button>

        {showRejected && (
          <div className={styles.rejectedList}>
            {rejectedCandidates.length === 0 ? (
              <div className={boardStyles.empty}>No rejected candidates.</div>
            ) : (
              rejectedCandidates.map((c) => (
                <div key={c.id} className={styles.rejectedRow}>
                  <span className={styles.rejectedName}>{c.name}</span>
                  <span className={styles.rejectedMeta}>{c.matchPercent}% match · Rejected</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
