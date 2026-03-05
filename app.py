import requests
from flask import Flask, request, Response, send_from_directory
import os
import json

app = Flask(__name__, static_folder='.')

@app.route('/')
def index():
    with open(os.path.join('.', 'index.html'), 'r') as f:
        html = f.read()
    bearer_token = os.environ.get('X_BEARER_TOKEN', '')
    html = html.replace('%%BEARER_TOKEN%%', bearer_token)
    response = Response(html, mimetype='text/html')
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

@app.route('/check-password', methods=['POST'])
def check_password():
    data = request.get_json()
    password = data.get('password', '')
    correct = os.environ.get('APP_PASSWORD', '')
    if password == correct:
        return Response('{"ok": true}', mimetype='application/json')
    return Response('{"ok": false}', mimetype='application/json')

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
        api_key = os.environ.get('ANTHROPIC_API_KEY', '')
        resp = requests.post(
            'https://api.anthropic.com/v1/messages',
            headers={
                'x-api-key': api_key,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            },
            data=request.get_data(),
            timeout=120
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
