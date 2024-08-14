from flask import Flask, jsonify
import sys
import os

app = Flask(__name__)

@app.route('/')
def hello():
    print("Request received!", file=sys.stderr)
    
    test_env = os.environ.get('TEST_ENV')
    
    if test_env != "12345":
        return jsonify({"error": "Invalid TEST_ENV value"}), 500
    
    return jsonify({"message": "Hello, World!", "TEST_ENV": test_env}), 200

if __name__ == '__main__':
    print("Starting Flask app...", file=sys.stderr)
    app.run(host='0.0.0.0', port=8000)