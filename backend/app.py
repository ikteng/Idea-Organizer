import sqlite3
from flask import Flask, jsonify, request
from flask_cors import CORS
from sentence_transformers import SentenceTransformer
from sklearn.cluster import DBSCAN

app = Flask(__name__)
CORS(app)

DB_PATH = "./backend/database.db"
print("⏳ [Startup] Initializing SentenceTransformer model...")
model = SentenceTransformer("all-MiniLM-L6-v2")
print("✅ [Startup] Model loaded successfully.")

def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        print("🛠️  [Database] Initializing SQLite database...")
        c = conn.cursor()
        c.execute("""CREATE TABLE IF NOT EXISTS ideas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            text TEXT NOT NULL,
            x INTEGER DEFAULT 0,
            y INTEGER DEFAULT 0,
            z INTEGER DEFAULT 0,
            width INTEGER DEFAULT 200,
            height INTEGER DEFAULT 100
        )""")

        c.execute("""CREATE TABLE IF NOT EXISTS connections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_id INTEGER NOT NULL,
            target_id INTEGER NOT NULL,
            source_point TEXT NOT NULL,
            target_point TEXT NOT NULL,
            FOREIGN KEY(source_id) REFERENCES ideas(id),
            FOREIGN KEY(target_id) REFERENCES ideas(id)
        )""")
        conn.commit()
    print("✅ [Database] Database ready.")

def cluster_ideas(ideas, eps=0.60, min_samples=1):
    if not ideas:
        print("ℹ️ [Clustering] No ideas to cluster.")
        return ideas

    print("🔢 [Clustering] Encoding ideas...")
    texts = [idea["text"] for idea in ideas]
    embeddings = model.encode(texts, show_progress_bar=True)

    # DBSCAN clustering using cosine distance
    print("🔍 [Clustering] Performing DBSCAN clustering...")
    clustering = DBSCAN(eps=eps, min_samples=min_samples, metric="cosine")
    cluster_labels = clustering.fit_predict(embeddings)

    print(f"✅ [Clustering] Assigned {len(set(cluster_labels))} clusters.")
    for idea, label in zip(ideas, cluster_labels):
        idea["cluster"] = int(label)

    return ideas

@app.route("/api/ideas", methods=["GET"])
def get_ideas():
    print("Getting ideas...")
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute("SELECT * FROM ideas")
        rows = c.fetchall()
        print(f"Fetched {len(rows)} ideas from DB")
        ideas = [dict(row) for row in rows]
        clustered_ideas = cluster_ideas(ideas)
        return jsonify(clustered_ideas)

@app.route("/api/ideas", methods=["POST"])
def add_idea():
    print("Adding ideas...")
    data = request.get_json()
    text = data.get("text", "")
    x = data.get("x", 200)
    y = data.get("y", 200)
    width = data.get("width", 200)
    height = data.get("height", 100)

    if not text:
        return jsonify({"error": "Idea text is required"}), 400

    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute("INSERT INTO ideas (text, x, y, width, height) VALUES (?, ?, ?, ?, ?)", (text, x, y, width, height))
        conn.commit()

    return jsonify({"message": "Idea added"}), 201

@app.route("/api/ideas/<int:idea_id>", methods=["PATCH"])
def update_idea(idea_id):
    print("Updating idea...")
    data = request.get_json()

    fields = []
    values = []

    for field in ["x", "y", "width", "height", "text"]:
        if field in data:
            fields.append(f"{field} = ?")
            values.append(data[field])

    if not fields:
        return jsonify({"error": "No valid fields to update"}), 400

    values.append(idea_id)
    query = f"UPDATE ideas SET {', '.join(fields)} WHERE id = ?"

    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute(query, values)
        conn.commit()

    return jsonify({"message": "Idea updated"}), 200

@app.route("/api/ideas/<int:idea_id>", methods=["DELETE"])
def delete_idea(idea_id):
    print("Deleting idea...")
    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute("DELETE FROM ideas WHERE id = ?", (idea_id,))
        conn.commit()
    return jsonify({"message": "Idea deleted"}), 200

@app.route("/api/connections", methods=["POST"])
def add_connection():
    print("Adding a connection...")
    data = request.get_json()
    source_id = data.get("fromId")
    target_id = data.get("toId")
    source_point = data.get("fromPos")
    target_point = data.get("toPos")

    if not all([source_id, target_id, source_point, target_point]):
        return jsonify({"error": "Missing connection data"}), 400

    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute("""
            INSERT INTO connections (source_id, target_id, source_point, target_point)
            VALUES (?, ?, ?, ?)
        """, (source_id, target_id, source_point, target_point))
        conn.commit()
        new_id = c.lastrowid

    return jsonify({"message": "Connection saved", "id": new_id}), 201

@app.route("/api/connections", methods=["GET"])
def get_connections():
    print("Getting connections...")
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute("SELECT * FROM connections")
        rows = c.fetchall()
        return jsonify([dict(row) for row in rows])

@app.route("/api/connections/<int:connection_id>", methods=["DELETE"])
def delete_connection(connection_id):
    print(f"Deleting connection {connection_id}...")
    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute("DELETE FROM connections WHERE id = ?", (connection_id,))
        conn.commit()
    return jsonify({"message": "Connection deleted"}), 200

if __name__ == "__main__":
    init_db()
    app.run(debug=False, use_reloader=True)
