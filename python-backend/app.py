from flask import Flask, request, jsonify
import spacy
from flask_cors import CORS
import numpy as np

app = Flask(__name__)
CORS(app)

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
        
        print(f'Received text for embedding: {text}')
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        # Process text with spaCy
        doc = nlp(text)
        
        # Get document vector (average of token vectors)
        embedding = doc.vector.tolist()
        
        print(f'Generated embedding length: {len(embedding)}')
        print(f'First 5 values: {embedding[:5]}')
        
        return jsonify({'embedding': embedding})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)