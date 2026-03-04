import requests
from flask import Flask, request, Response, send_from_directory
import os

app = Flask(__name__, static_folder='.')

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>', methods=['GET', 'OPTIONS'])
def proxy(path):
    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
    }
    if request.method == 'OPTIONS':
        return Response('', 200, headers=cors_headers)
    url = f'https://api.twitter.com/{path}'
    auth = request.headers.get('Authorization', '')
    try:
        resp = requests.get(url, headers={'Authorization': auth}, params=request.args, timeout=10)
        cors_headers['Content-Type'] = 'application/json'
        return Response(resp.content, status=resp.status_code, headers=cors_headers)
    except Exception as e:
        cors_headers['Content-Type'] = 'application/json'
        return Response(f'{{"error": "{str(e)}"}}', status=500, headers=cors_headers)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
