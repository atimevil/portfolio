import { createPost } from '../lib/blog'
import { prisma } from '../lib/prisma'

// Notion "파일 메모리 가공" 글을 옮기는 일회성 스크립트. 실행 후 지운다.
const content = `프로젝트에서 오디오 파일을 업로드받아 분석하는 Flask API를 처음 만들 때는, 업로드된 파일을 서버 디스크에 저장한 뒤 그 경로를 모델 함수에 넘기는 방식으로 짰다.

## 초기 버전 — 파일을 디스크에 저장

\`\`\`python
from flask import Flask, request, jsonify
import torch
import logging
import module_model
import os
from werkzeug.utils import secure_filename
import numpy as np
from flask_cors import CORS
from threading import Lock

app = Flask(__name__)

CORS(app, resources={r"/*": {"origins": "*"}})

app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['ALLOWED_EXTENSIONS'] = {'wav', 'mp3', 'mp4', 'flac'}  # 허용 파일 형식
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 최대 16MB 파일

job_lock = Lock()

def get_device(device_type: str) -> torch.device:
    return torch.device("cuda" if device_type in ['gpu', 'cuda'] and torch.cuda.is_available() else "cpu")

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

def scoreto(score):
    score = (1 / (1 + np.exp(2 * (score + 6))))
    return score

@app.route('/analyze', methods=['POST'])
def analyze():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        device_type = request.form.get('device', 'gpu')
        device = get_device(device_type)

        logging.info("Received File: %s", filename)
        logging.info("Device Type: %s", device)

        with job_lock:
            logging.info("Job started for file: %s", filename)
            score = module_model.test_model(filepath, device)
            score_values = [scoreto(s.item()) for s in score]
            stt = module_model.STT(filepath, device)
            logging.info("STT Result: %s", stt)
            logging.info("Analyzed Score: %s", score_values)
            logging.info("Job finished for file: %s", filename)

        return jsonify({'score': score_values, 'text': stt})
    else:
        return jsonify({'error': 'Invalid file type'}), 400

@app.route('/')
def user():
    return 'Hello, World!'

if __name__ == '__main__':
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])

    app.run('0.0.0.0', port=2580, debug=True)
\`\`\`

동작 자체는 문제없다.

1. 클라이언트가 파일을 업로드한다
2. 서버가 \`file.save(filepath)\`로 \`uploads/파일명.wav\`에 저장한다
3. \`module_model.test_model(filepath)\`처럼 파일 경로를 읽는 함수에 넘긴다
4. 결과를 반환한다

다만 요청마다 디스크에 파일을 쓰고, 처리가 끝난 뒤에는 그 파일을 지워야 한다. 동시 요청이 늘어나면 디스크 I/O가 그대로 병목이 되고, 지우는 걸 깜빡하면 업로드 폴더만 계속 쌓인다.

## 최종 버전 — 메모리 버퍼로 처리

파일을 디스크에 쓰지 않고, 업로드된 바이트를 그대로 메모리에서 처리하도록 바꿨다.

\`\`\`python
@app.route('/analyze', methods=['POST'])
def analyze():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    filename = file.filename

    if not filename or '.' not in filename:
        return jsonify({'error': 'Invalid filename'}), 400
    ext = filename.rsplit('.', 1)[1].lower()
    if ext not in {'wav', 'mp3', 'mp4', 'flac'}:
        return jsonify({'error': 'Invalid file type'}), 400

    file_bytes = file.read()

    device_type = request.form.get('device', 'gpu')
    device = get_device(device_type)

    with job_lock:
        score = module_model.test_model(file_bytes, device)
        score_values = [scoreto(s.item()) for s in score]
        stt = module_model.STT(file_bytes, device)

    return jsonify({'score': score_values, 'text': stt})
\`\`\`

바뀐 부분은 세 단계다.

\`\`\`python
# 1. 업로드된 파일을 메모리로 읽는다
file = request.files['file']
file_bytes = file.read()

# 2. 필요하면 메모리 버퍼로 감싼다
buffer = io.BytesIO(file_bytes)

# 3. 바로 처리한다
score = module_model.test_model(file_bytes, device)
\`\`\`

\`io\` 모듈의 \`BytesIO\`는 메모리 상의 바이트를 파일처럼 다룰 수 있게 해준다. 파일 객체를 기대하는 함수라면 \`file_bytes\`를 직접 넘기는 대신 \`io.BytesIO(file_bytes)\`로 감싸서 넘기면 된다.

디스크에 쓰고 지우는 단계가 사라지니 코드도 짧아졌고, 임시 파일을 정리할 필요도 없어졌다.
`

async function main() {
  const slug = await createPost({
    title: 'Flask API에서 파일을 디스크 대신 메모리로 처리하기',
    date: '2025-09-03',
    tags: ['Python', 'Flask'],
    category: 'Backend',
    excerpt: '업로드된 오디오 파일을 디스크에 저장하지 않고 io.BytesIO로 메모리에서 바로 처리하도록 바꾼 기록.',
    content,
    status: 'draft',
    contentFormat: 'markdown',
  })
  console.log(`created: ${slug}`)
}

main().finally(() => prisma.$disconnect())
