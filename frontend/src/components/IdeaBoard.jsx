import React, { useEffect, useState } from "react";
import axios from "axios";
import "./IdeaBoard.css";

let cardIdCounter = 1;

function IdeaBoard() {
  const [ideas, setIdeas] = useState([]);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [draggingId, setDraggingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [highlightedId, setHighlightedId] = useState(null);

  useEffect(() => {
    axios.get("http://localhost:5000/api/ideas").then((res) => {
      setIdeas(
        res.data.map((idea) => ({
          ...idea,
          x: idea.x || 100,
          y: idea.y || 100,
          zIndex: idea.zIndex ?? index + 1,
          isEditing: false,
        }))
      );
    });
  }, []);

  const getHighestZIndex = () => {
    return ideas.reduce((max, idea) => Math.max(max, idea.zIndex || 0), 0);
};

  useEffect(() => {
    const handleClickOutside = (e) => {
      const menu = document.querySelector(".side-menu");
      const hamburger = document.querySelector(".hamburger-btn");
      if (
        isMenuOpen &&
        menu &&
        !menu.contains(e.target) &&
        !hamburger.contains(e.target)
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

    const handleMouseDown = (e, id) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setDraggingId(id);

    const maxZ = getHighestZIndex();

    setIdeas((ideas) =>
        ideas.map((idea) =>
        idea.id === id ? { ...idea, zIndex: maxZ + 1 } : idea
        )
    );
    };

  const handleMouseMove = (e) => {
    if (draggingId === null) return;
    const whiteboard = document.querySelector(".whiteboard");
    const rect = whiteboard.getBoundingClientRect();
    const x = e.clientX - dragOffset.x - rect.left;
    const y = e.clientY - dragOffset.y - rect.top;

    setIdeas((ideas) =>
      ideas.map((idea) =>
        idea.id === draggingId ? { ...idea, x, y } : idea
      )
    );
  };

  const handleMouseUp = () => {
    if (draggingId && typeof draggingId === "number") {
      const idea = ideas.find((i) => i.id === draggingId);
      axios
        .patch(`http://localhost:5000/api/ideas/${draggingId}`, {
          x: idea.x,
          y: idea.y,
        })
        .catch((err) => console.error("Failed to save position:", err));
    }
    setDraggingId(null);
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  });

  const clusterColors = [
    "#fff9c4", "#b2ebf2", "#ffcdd2", "#d1c4e9", "#c8e6c9", "#ffecb3", "#e0f7fa",
  ];

  const getColorForCluster = (cluster) => {
    if (cluster === undefined || cluster === -1) return "#eeeeee";
    return clusterColors[cluster % clusterColors.length];
  };

  const handleAddCard = () => {
    const newCard = {
      id: `temp-${cardIdCounter++}`,
      text: "",
      x: 200,
      y: 200,
      isEditing: true,
    };
    setIdeas([...ideas, newCard]);
  };

  const handleTextChange = (id, newText) => {
    setIdeas((ideas) =>
      ideas.map((idea) => (idea.id === id ? { ...idea, text: newText } : idea))
    );
  };

const handleBlur = (id) => {
  const idea = ideas.find((idea) => idea.id === id);
  if (!idea || idea.text.trim() === "") return;

  // If it's a new card
  if (typeof idea.id === "string" && idea.id.startsWith("temp")) {
    axios
      .post("http://localhost:5000/api/ideas", {
        text: idea.text,
        x: idea.x,
        y: idea.y,
      })
      .then(() => {
        axios.get("http://localhost:5000/api/ideas").then((res) => {
          setIdeas(res.data.map((idea) => ({ ...idea, isEditing: false })));
        });
      });
  } else {
    // Existing card – update text and refresh cluster
    axios
      .patch(`http://localhost:5000/api/ideas/${id}/text`, {
        text: idea.text,
      })
      .then(() => {
        axios.get("http://localhost:5000/api/ideas").then((res) => {
          setIdeas(res.data.map((idea) => ({ ...idea, isEditing: false })));
        });
      })
      .catch((err) => console.error("Text update failed:", err));
  }

  // Exit editing mode immediately
  setIdeas((ideas) =>
    ideas.map((idea) =>
      idea.id === id ? { ...idea, isEditing: false } : idea
    )
  );
};

  const handleDelete = (id) => {
    setIdeas((ideas) => ideas.filter((idea) => idea.id !== id));
    if (typeof id === "number") {
      axios
        .delete(`http://localhost:5000/api/ideas/${id}`)
        .catch((err) => console.error("Delete failed:", err));
    }
  };

  const filteredIdeas = ideas.filter((idea) =>
    idea.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="board-container">
      <div className="top-toolbar">
        <button className="hamburger-btn" onClick={() => setIsMenuOpen(true)}>
          &#9776;
        </button>

        {isMenuOpen && (
          <div className="side-menu">
            <button
              className="close-menu-btn"
              onClick={() => setIsMenuOpen(false)}
            >
              ×
            </button>
            <h3>Index</h3>
            <ul>
              {ideas.map((idea) => (
                <li
                  key={idea.id}
                  className={idea.id === highlightedId ? "highlighted" : ""}
                  onClick={() => {
                    setHighlightedId(idea.id);
                    const el = document.getElementById(`idea-${idea.id}`);
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                    setTimeout(() => setHighlightedId(null), 1000);
                    }}
                >
                  {idea.text || <em>Untitled</em>}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search ideas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="clear-search-btn"
              onClick={() => setSearchQuery("")}
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className={`whiteboard ${isMenuOpen ? "with-menu" : ""}`}>
        {filteredIdeas.map((idea) => (
          <div
            id={`idea-${idea.id}`}
            key={idea.id}
            className={`idea-card ${
              idea.id === highlightedId ? "highlighted-card" : ""
            }`}
            style={{
              left: idea.x,
              top: idea.y,
              background: getColorForCluster(idea.cluster),
              zIndex: idea.zIndex || 1,
            }}
            onMouseDown={(e) => handleMouseDown(e, idea.id)}
          >
            <button
              className="delete-btn"
              onClick={() => handleDelete(idea.id)}
            >
              ×
            </button>

            {idea.isEditing ? (
              <textarea
                autoFocus
                value={idea.text}
                onChange={(e) => handleTextChange(idea.id, e.target.value)}
                onBlur={() => handleBlur(idea.id)}
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
        ))}
      </div>

      <div className="bottom-toolbar">
        <button className="add-btn" onClick={handleAddCard}>
          + Add Card
        </button>
      </div>
    </div>
  );
}

export default IdeaBoard;
