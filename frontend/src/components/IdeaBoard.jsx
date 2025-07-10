import React, { useEffect, useState } from "react";
import axios from "axios";
import "./styles/IdeaBoard.css";
import TopToolbar from "./TopToolbar";
import IdeaCard from "./IdeaCard";

let cardIdCounter = 1;

function IdeaBoard() {
  const [ideas, setIdeas] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedId, setHighlightedId] = useState(null);

  useEffect(() => {
    axios.get("http://localhost:5000/api/ideas").then((res) => {
      try {
        setIdeas(
          res.data.map((idea, index) => ({
            ...idea,
            x: idea.x || 100,
            y: idea.y || 100,
            zIndex: idea.zIndex ?? index + 1,
            width: idea.width || 200,
            height: idea.height || 100,
            isEditing: false,
          }))
        );
      } catch (err) {
        console.error("Failed to process ideas:", err);
      }
    });
  }, []);

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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const getHighestZIndex = () => {
    return ideas.reduce((max, idea) => Math.max(max, idea.zIndex || 0), 0);
  };

  const handleAddCard = () => {
    const newCard = {
      id: `temp-${cardIdCounter++}`,
      text: "",
      x: 200,
      y: 200,
      width: 200,
      height: 100,
      isEditing: true,
    };
    setIdeas((prevIdeas) => [...prevIdeas, newCard]);
  };

  const filteredIdeas = ideas.filter((idea) =>
    idea.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="board-container">
      <TopToolbar
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        ideas={ideas}
        highlightedId={highlightedId}
        setHighlightedId={setHighlightedId}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <div className={`whiteboard ${isMenuOpen ? "with-menu" : ""}`}>
        {filteredIdeas.map((idea) => (
          <IdeaCard
            key={idea.id}
            idea={idea}
            setIdeas={setIdeas}
            getHighestZIndex={getHighestZIndex}
          />
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
