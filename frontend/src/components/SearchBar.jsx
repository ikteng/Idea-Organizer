// SearchBar.jsx

import React from "react";
import "./styles/SearchBar.css";

function SearchBar({ searchQuery, setSearchQuery }) {
  return (
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
  );
}

export default SearchBar;