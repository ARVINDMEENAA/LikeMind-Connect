import numpy as np
import spacy
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Load spaCy model with fallback
try:
    nlp = spacy.load("en_core_web_md")
    print("Loaded en_core_web_md model successfully")
except OSError:
    try:
        # Try smaller model as fallback
        nlp = spacy.load("en_core_web_sm")
        print("Loaded en_core_web_sm model as fallback")
    except OSError:
        print(
            "No spaCy models available. Using blank model with word vectors disabled."
        )
        nlp = spacy.blank("en")
        # Add basic components
        nlp.add_pipe("sentencizer")


@app.route("/")
def home():
    return jsonify(
        {"message": "LikeMind Connect - SpaCy NLP Server", "status": "running"}
    )


@app.route("/embeddings", methods=["POST"])
def get_embeddings():
    try:
        data = request.json
        text = data.get("text", "")

        print(f"Received text for embedding: {text}")

        if not text:
            return jsonify({"error": "No text provided"}), 400

        # Process text with spaCy
        doc = nlp(text)

        # Check if model has word vectors
        if doc.vector.size == 0:
            # Fallback: create simple hash-based embedding
            embedding = [float(hash(text) % 1000) / 1000.0] * 300
        else:
            # Get document vector (average of token vectors)
            embedding = doc.vector.tolist()

        print(f"Generated embedding length: {len(embedding)}")
        print(f"First 5 values: {embedding[:5]}")

        return jsonify({"embedding": embedding})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy"})


if __name__ == "__main__":
    import os

    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=False)
