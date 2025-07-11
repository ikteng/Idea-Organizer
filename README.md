# Idea-Organizer

💡 “Idea Organizer” – Smart Thought Whiteboard App
Problem:
People often jot down thoughts in notes—but rarely revisit, categorize, or expand them. Ideas remain shallow, disorganized, and forgotten.

🌟 Features
1. Visual Idea Board
- minimalist whiteboard
- Users can add "idea cards" with text.
- Add, move, resize idea cards freely

2. Idea Clustering / Related Detection
- Automatically detect similar or duplicate ideas using NLP
- Cluster related ideas with shared color themes
- Uses cosine similarity or transformer embeddings on card content

3. Search & Filter
- Keyword search to highlight and filter cards
- Can combine with cluster filters for grouped exploration

Improvements:
- Media Support
    - Drag-and-drop image uploads to cards
    - Add YouTube/video links or local file upload
    - Cards support mixed content (text + media)
- Database Upgrade
    - Moved backend from SQLite ➝ PostgreSQL
    - Allows scalable, structured storage of ideas, media, and connections
- Graph Relationships
    - Connect idea cards visually with lines and arrows
    - Drag-to-connect interface for forming thought relationships