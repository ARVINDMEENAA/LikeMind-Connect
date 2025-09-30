from flask import Flask, request, jsonify
import spacy
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# Load secret key from environment
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'defaultsecret')

# Load spaCy model (download with: python -m spacy download en_core_web_md)
try:
    nlp = spacy.load("en_core_web_md")
except OSError:
    print("Please install spaCy model: python -m spacy download en_core_web_md")
    exit(1)

@app.route('/')
def home():
    return jsonify({'message': 'LikeMind Connect - SpaCy NLP Server', 'status': 'running'})

@app.route('/embeddings', methods=['POST'])
def get_embeddings():
    try:
        data = request.json
        text = data.get('text', '')

        if not text:
            return jsonify({'error': 'No text provided'}), 400

        doc = nlp(text)
        embedding = doc.vector.tolist()

        return jsonify({'embedding': embedding})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    debug_mode = os.environ.get('DEBUG', 'False') == 'True'
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
