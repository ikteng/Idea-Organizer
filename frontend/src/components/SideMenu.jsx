// SideMenu.jsx
import React from "react";
import "./styles/SideMenu.css";

function SideMenu({ ideas, highlightedId, setHighlightedId, setIsMenuOpen }) {
  const handleClick = (id) => {
    setHighlightedId(id);
    const el = document.getElementById(`idea-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    setTimeout(() => setHighlightedId(null), 1000);
  };

  return (
    <div className="side-menu">
      <button className="close-menu-btn" onClick={() => setIsMenuOpen(false)}>
        ×
      </button>
      <h3>Index</h3>
      <ul>
        {ideas.map((idea) => (
          <li
            key={idea.id}
            className={idea.id === highlightedId ? "highlighted" : ""}
            onClick={() => handleClick(idea.id)}
          >
            {idea.text || <em>Untitled</em>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SideMenu;
