from flask import Flask, request, jsonify
import os
import subprocess
from werkzeug.utils import secure_filename

app = Flask(__name__)

UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

@app.route('/flawfind', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No file selected for uploading'}), 400

    filename = secure_filename(file.filename)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)

    try:
        result = run_flawfinder(file_path)
        return jsonify({'result': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

def run_flawfinder(file_path):
    """
    Run flawfinder on the uploaded file and return the result.
    """
    try:
        process = subprocess.Popen(['flawfinder', file_path], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        stdout, stderr = process.communicate()

        if process.returncode != 0:
            raise Exception(f"Flawfinder error: {stderr.decode('utf-8')}")

        return stdout.decode('utf-8')

    except FileNotFoundError:
        raise Exception("Flawfinder is not installed or not found in PATH.")

if __name__ == '__main__':
    app.run(debug=True)