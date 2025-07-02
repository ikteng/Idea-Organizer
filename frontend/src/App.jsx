// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import IdeaBoard from "./components/IdeaBoard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<IdeaBoard />} />
      </Routes>
    </Router>
  );
}

export default App;
