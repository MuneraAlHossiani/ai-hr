"use client";

import { useState } from "react";
import { Draggable } from "@hello-pangea/dnd";
import styles from "./kanban.module.css";

function matchTierClass(matchPercent) {
  if (matchPercent >= 75) return styles.tierGreen;
  if (matchPercent >= 50) return styles.tierAmber;
  return styles.tierRed;
}

export default function CandidateCard({ candidate, index, onMarkHired, hiringId, isPending }) {
  const [expanded, setExpanded] = useState(false);
  const isHiring = hiringId === candidate.id;

  return (
    <Draggable draggableId={candidate.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`${styles.card} ${matchTierClass(candidate.matchPercent)} ${
            snapshot.isDragging ? styles.cardDragging : ""
          } ${isPending ? styles.cardPending : ""}`}
        >
          <div className={styles.cardTop}>
            <span className={styles.candidateName}>{candidate.name}</span>
            <span className={styles.matchPercent}>{candidate.matchPercent}%</span>
          </div>

          <button type="button" className={styles.toggleBtn} onClick={() => setExpanded((e) => !e)}>
            {expanded ? "Hide details ▲" : "Show details ▼"}
          </button>

          {expanded && (
            <div className={styles.details}>
              <div>
                <strong>Pros</strong>
                <ul>
                  {candidate.pros.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
              <div>
                <strong>Cons</strong>
                <ul>
                  {candidate.cons.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
              <div>
                <strong>Suggested Questions</strong>
                <ul>
                  {candidate.suggestedQuestions.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {candidate.status !== "closed" && candidate.status !== "rejected" && (
            <button
              type="button"
              className={styles.hireBtn}
              disabled={isHiring}
              onClick={() => onMarkHired(candidate.id)}
            >
              {isHiring ? "Marking as hired..." : "Mark as Hired"}
            </button>
          )}
        </div>
      )}
    </Draggable>
  );
}
