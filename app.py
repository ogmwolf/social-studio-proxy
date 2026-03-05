import requests
from flask import Flask, request, Response, send_from_directory
import os
import json

app = Flask(__name__, static_folder='.')

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/proxy/anthropic', methods=['POST', 'OPTIONS'])
def anthropic_proxy():
    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type, x-api-key, anthropic-version',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    }
    if request.method == 'OPTIONS':
        return Response('', 200, headers=cors_headers)
    try:
        resp = requests.post(
            'https://api.anthropic.com/v1/messages',
            headers={
                'x-api-key': request.headers.get('x-api-key', ''),
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            },
            data=request.get_data(),
            timeout=60
        )
        cors_headers['Content-Type'] = 'application/json'
        return Response(resp.content, status=resp.status_code, headers=cors_headers)
    except Exception as e:
        cors_headers['Content-Type'] = 'application/json'
        return Response(f'{{"error": "{str(e)}"}}', status=500, headers=cors_headers)

@app.route('/<path:path>', methods=['GET', 'OPTIONS'])
def twitter_proxy(path):
    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
    }
    if request.method == 'OPTIONS':
        return Response('', 200, headers=cors_headers)
    url = f'https://api.twitter.com/{path}'
    token = request.args.get('bearer_token', '')
    params = {k: v for k, v in request.args.items() if k != 'bearer_token'}
    try:
        resp = requests.get(
            url,
            headers={'Authorization': f'Bearer {token}', 'User-Agent': 'SocialStudio/1.0'},
            params=params,
            timeout=10
        )
        cors_headers['Content-Type'] = 'application/json'
        return Response(resp.content, status=resp.status_code, headers=cors_headers)
    except Exception as e:
        cors_headers['Content-Type'] = 'application/json'
        return Response(f'{{"error": "{str(e)}"}}', status=500, headers=cors_headers)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
