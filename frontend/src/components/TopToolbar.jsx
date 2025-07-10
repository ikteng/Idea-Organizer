// TopToolbar.jsx
import React from "react";
import "./styles/TopToolbar.css";
import SideMenu from "./SideMenu";
import SearchBar from "./SearchBar";

function TopToolbar({
  isMenuOpen,
  setIsMenuOpen,
  ideas,
  highlightedId,
  setHighlightedId,
  searchQuery,
  setSearchQuery,
}) {
  return (
    <div className="top-toolbar">
      <button className="hamburger-btn" onClick={() => setIsMenuOpen(true)}>
        &#9776;
      </button>

      {isMenuOpen && (
        <SideMenu
          ideas={ideas}
          highlightedId={highlightedId}
          setHighlightedId={setHighlightedId}
          setIsMenuOpen={setIsMenuOpen}
        />
      )}

      <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
    </div>
  );
}

export default TopToolbar;
