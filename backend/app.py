import sqlite3
from flask import Flask, jsonify, request
from flask_cors import CORS
from sentence_transformers import SentenceTransformer
from sklearn.cluster import DBSCAN

app = Flask(__name__)
CORS(app)

DB_PATH = "./backend/database.db"
# model = SentenceTransformer("all-MiniLM-L6-v2")
model = SentenceTransformer("paraphrase-MiniLM-L3-v2")

def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute("""CREATE TABLE IF NOT EXISTS ideas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            text TEXT NOT NULL,
            tags TEXT,
            x INTEGER DEFAULT 0,
            y INTEGER DEFAULT 0,
            z INTEGER DEFAULT 0
        )""")
        conn.commit()

def cluster_ideas(ideas, eps=0.60, min_samples=1):
    if not ideas:
        return ideas

    texts = [idea["text"] for idea in ideas]
    embeddings = model.encode(texts, show_progress_bar=False)

    # DBSCAN clustering using cosine distance
    clustering = DBSCAN(eps=eps, min_samples=min_samples, metric="cosine")
    cluster_labels = clustering.fit_predict(embeddings)

    for idea, label in zip(ideas, cluster_labels):
        idea["cluster"] = int(label)

    return ideas

@app.route("/api/ideas", methods=["GET"])
def get_ideas():
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute("SELECT * FROM ideas")
        rows = c.fetchall()
        ideas = [dict(row) for row in rows]
        clustered_ideas = cluster_ideas(ideas)
        return jsonify(clustered_ideas)

@app.route("/api/ideas", methods=["POST"])
def add_idea():
    data = request.get_json()
    text = data.get("text", "")
    tags = data.get("tags", "")
    x = data.get("x", 200)
    y = data.get("y", 200)

    if not text:
        return jsonify({"error": "Idea text is required"}), 400

    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute("INSERT INTO ideas (text, tags, x, y) VALUES (?, ?, ?, ?)", (text, tags, x, y))
        conn.commit()

    return jsonify({"message": "Idea added"}), 201

@app.route("/api/ideas/<int:idea_id>", methods=["PATCH"])
def update_idea_position(idea_id):
    data = request.get_json()
    x = data.get("x")
    y = data.get("y")

    if x is None or y is None:
        return jsonify({"error": "Missing position"}), 400

    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute("UPDATE ideas SET x = ?, y = ? WHERE id = ?", (x, y, idea_id))
        conn.commit()

    return jsonify({"message": "Position updated"}), 200

@app.route("/api/ideas/<int:idea_id>/text", methods=["PATCH"])
def update_idea_text(idea_id):
    data = request.get_json()
    text = data.get("text", "").strip()

    if not text:
        return jsonify({"error": "Text is required"}), 400

    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute("UPDATE ideas SET text = ? WHERE id = ?", (text, idea_id))
        conn.commit()

    return jsonify({"message": "Text updated"}), 200

@app.route("/api/ideas/<int:idea_id>", methods=["DELETE"])
def delete_idea(idea_id):
    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute("DELETE FROM ideas WHERE id = ?", (idea_id,))
        conn.commit()
    return jsonify({"message": "Idea deleted"}), 200

if __name__ == "__main__":
    init_db()
    app.run(debug=False, use_reloader=True)
