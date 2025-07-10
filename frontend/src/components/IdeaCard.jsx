import React, { useState, useEffect } from "react";
import axios from "axios";
import "./styles/IdeaCard.css";

const clusterColors = [
  "#fff9c4", "#b2ebf2", "#ffcdd2", "#d1c4e9", "#c8e6c9", "#ffecb3", "#e0f7fa",
];

function IdeaCard({ idea, setIdeas, getHighestZIndex }) {
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0 });
  const [initialSize, setInitialSize] = useState({ width: 0, height: 0 });

  const getColorForCluster = (cluster) => {
    if (cluster === undefined || cluster === -1) return "#eeeeee";
    return clusterColors[cluster % clusterColors.length];
  };

  const handleMouseDown = (e) => {
    if (e.target.classList.contains("resize-handle")) return;

    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setDragging(true);

    const maxZ = getHighestZIndex();
    setIdeas((ideas) =>
      ideas.map((i) => (i.id === idea.id ? { ...i, zIndex: maxZ + 1 } : i))
    );
  };

  const handleMouseMove = (e) => {
    if (dragging) {
      const board = document.querySelector(".whiteboard");
      const rect = board.getBoundingClientRect();
      const x = e.clientX - dragOffset.x - rect.left;
      const y = e.clientY - dragOffset.y - rect.top;

      setIdeas((ideas) =>
        ideas.map((i) => (i.id === idea.id ? { ...i, x, y } : i))
      );
    }

    if (resizing) {
      const dx = e.clientX - resizeStart.x;
      const dy = e.clientY - resizeStart.y;
      const newWidth = Math.max(100, initialSize.width + dx);
      const newHeight = Math.max(80, initialSize.height + dy);

      setIdeas((ideas) =>
        ideas.map((i) =>
          i.id === idea.id ? { ...i, width: newWidth, height: newHeight } : i
        )
      );
    }
  };

  const handleMouseUp = () => {
    if (dragging) {
      setDragging(false);
      if (typeof idea.id === "number") {
        axios.patch(`http://localhost:5000/api/ideas/${idea.id}`, {
          x: idea.x,
          y: idea.y,
        });
      }
    }

    if (resizing) {
      setResizing(false);
      if (typeof idea.id === "number") {
        axios.patch(`http://localhost:5000/api/ideas/${idea.id}`, {
          width: idea.width,
          height: idea.height,
        });
      }
    }
  };

  const handleTextChange = (text) => {
    setIdeas((ideas) =>
      ideas.map((i) => (i.id === idea.id ? { ...i, text } : i))
    );
  };

  const handleBlur = () => {
    if (!idea.text.trim()) return;

    if (typeof idea.id === "string" && idea.id.startsWith("temp")) {
      axios
        .post("http://localhost:5000/api/ideas", {
          text: idea.text,
          x: idea.x,
          y: idea.y,
        })
        .then(() => {
          axios.get("http://localhost:5000/api/ideas").then((res) => {
            setIdeas(res.data.map((i) => ({ ...i, isEditing: false })));
          });
        });
    } else {
      axios
        .patch(`http://localhost:5000/api/ideas/${idea.id}`, {
          text: idea.text,
        })
        .then(() => {
          axios.get("http://localhost:5000/api/ideas").then((res) => {
            setIdeas(res.data.map((i) => ({ ...i, isEditing: false })));
          });
        });
    }

    setIdeas((ideas) =>
      ideas.map((i) => (i.id === idea.id ? { ...i, isEditing: false } : i))
    );
  };

  const handleDelete = () => {
    setIdeas((ideas) => ideas.filter((i) => i.id !== idea.id));
    if (typeof idea.id === "number") {
      axios.delete(`http://localhost:5000/api/ideas/${idea.id}`);
    }
  };

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  });

  return (
    <div
      className={`idea-card ${dragging ? "draggable" : ""}`}
      style={{
        left: idea.x,
        top: idea.y,
        width: idea.width,
        height: idea.height,
        zIndex: idea.zIndex,
        background: getColorForCluster(idea.cluster),
      }}
      onMouseDown={handleMouseDown}
    >
      <button className="delete-btn" onClick={handleDelete}>
        ×
      </button>

      <div
        className="resize-handle"
        onMouseDown={(e) => {
          e.stopPropagation();
          setResizing(true);
          setResizeStart({ x: e.clientX, y: e.clientY });
          setInitialSize({ width: idea.width, height: idea.height });
        }}
      />

      {idea.isEditing ? (
        <textarea
          autoFocus
          value={idea.text}
          onChange={(e) => handleTextChange(e.target.value)}
          onBlur={handleBlur}
          className="idea-edit"
        />
      ) : (
        <div
          className="idea-display"
          onClick={() =>
            setIdeas((ideas) =>
              ideas.map((i) =>
                i.id === idea.id ? { ...i, isEditing: true } : i
              )
            )
          }
        >
          {idea.text || "Click to edit"}
        </div>
      )}
    </div>
  );
}

export default IdeaCard;
