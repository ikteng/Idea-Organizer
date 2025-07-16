import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./styles/ConnectionLayer.css";

function ConnectionLayer({ ideas, connections, setConnections }) {
  const [tempLine, setTempLine] = useState(null);

  const handleStartConnection = useCallback((e, fromId, fromPos) => {
    e.stopPropagation();
    const boardRect = document.querySelector(".whiteboard").getBoundingClientRect();
    setTempLine({
      fromId,
      fromPos,
      x1: e.clientX - boardRect.left,
      y1: e.clientY - boardRect.top,
      x2: e.clientX - boardRect.left,
      y2: e.clientY - boardRect.top,
    });

    const handleMouseMove = (e) => {
      setTempLine((line) =>
        line
          ? {
              ...line,
              x2: e.clientX - boardRect.left,
              y2: e.clientY - boardRect.top,
            }
          : null
      );
    };

    const handleMouseUp = (e) => {
      const target = e.target.closest(".connection-point");
      if (target && target.dataset.position && target.closest(".idea-card")) {
        const toId = parseInt(target.closest(".idea-card").getAttribute("data-id"));
        const toPos = target.dataset.position;
        if (toId !== fromId) {
         const payload = { fromId, toId, fromPos, toPos };

            // Optimistic UI update (optional)
            const tempConn = { ...payload, id: null };
            setConnections((prev) => [...prev, tempConn]);

            axios
            .post("http://localhost:5000/api/connections", payload)
            .then((res) => {
                const saved = { ...payload, id: res.data.id };
                setConnections((prev) =>
                prev.map((c) =>
                    c === tempConn ? saved : c
                )
                );
            })
            .catch((err) => {
                console.error("Failed to save connection:", err);
                setConnections((prev) => prev.filter((c) => c !== tempConn));
            });

        }
      }

      setTempLine(null);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [setConnections]);

  const getConnectionPoint = (card, position) => {
    const el = document.querySelector(
      `.idea-card[data-id="${card.id}"] .connection-point.${position}`
    );

    if (el) {
      const rect = el.getBoundingClientRect();
      const boardRect = document.querySelector(".whiteboard").getBoundingClientRect();
      return [
        rect.left + rect.width / 2 - boardRect.left,
        rect.top + rect.height / 2 - boardRect.top,
      ];
    }

    // fallback to math approximation
    switch (position) {
      case "top": return [card.x + card.width / 2, card.y];
      case "right": return [card.x + card.width, card.y + card.height / 2];
      case "bottom": return [card.x + card.width / 2, card.y + card.height];
      case "left": return [card.x, card.y + card.height / 2];
      default: return [card.x, card.y];
    }
  };

  useEffect(() => {
    const elements = document.querySelectorAll(".connection-point");
    elements.forEach((el) => {
      el.onmousedown = (e) => {
        const card = el.closest(".idea-card");
        const fromId = parseInt(card.getAttribute("data-id"));
        const fromPos = el.dataset.position;
        handleStartConnection(e, fromId, fromPos);
      };
    });

    return () => {
      elements.forEach((el) => {
        el.onmousedown = null;
      });
    };
  }, [ideas, handleStartConnection]);

  // 🧹 Extracted deletion logic
  const deleteConnection = (conn, index) => {
    if (conn.id !== undefined) {
      axios
        .delete(`http://localhost:5000/api/connections/${conn.id}`)
        .then(() => {
          setConnections((prev) => prev.filter((c) => c.id !== conn.id));
        })
        .catch((err) => {
          console.error("Failed to delete connection:", err);
        });
    } else {
      // fallback for unsaved connections (e.g., newly drawn but not saved)
      setConnections((prev) => prev.filter((_, i) => i !== index));
    }
  };

  return (
    <svg className="connection-layer">
      {connections.map((conn, index) => {
        const from = ideas.find((i) => i.id === conn.fromId);
        const to = ideas.find((i) => i.id === conn.toId);
        if (!from || !to) return null;

        const [x1, y1] = getConnectionPoint(from, conn.fromPos);
        const [x2, y2] = getConnectionPoint(to, conn.toPos);
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;

        return (
          <g key={index} className="connection-group">
            <line
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="black" strokeWidth="2"
              pointerEvents="none"
              className="connection-line"
            />

            <circle
              cx={midX}
              cy={midY}
              r={8}
              fill="black"
              stroke="white"
              strokeWidth="1"
              style={{ cursor: "pointer" }}
              className="delete-handle"
              onClick={() => deleteConnection(conn, index)}
            />
          </g>
        );
      })}

      {tempLine && (
        <line
          x1={tempLine.x1} y1={tempLine.y1}
          x2={tempLine.x2} y2={tempLine.y2}
          stroke="gray" strokeWidth="2"
          strokeDasharray="4"
          pointerEvents="none"
        />
      )}
    </svg>
  );
}

export default ConnectionLayer;
