import requests
from flask import Flask, request, Response
from bs4 import BeautifulSoup
import os
import json

app = Flask(__name__)

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
        bearer_token = os.environ.get('X_BEARER_TOKEN', '')
        payload = json.dumps({'ok': True, 'bearer_token': bearer_token})
        return Response(payload, mimetype='application/json')
    return Response('{"ok": false}', mimetype='application/json')

@app.route('/expand-url', methods=['POST'])
def expand_url():
    try:
        data = request.get_json()
        url = data.get('url', '')
        resp = requests.get(url, timeout=8, headers={'User-Agent': 'Mozilla/5.0'}, allow_redirects=True)
        soup = BeautifulSoup(resp.text, 'html.parser')
        title = soup.title.string.strip() if soup.title else ''
        desc = ''
        meta = soup.find('meta', attrs={'name': 'description'}) or soup.find('meta', attrs={'property': 'og:description'})
        if meta:
            desc = meta.get('content', '')[:500]
        if not desc:
            p = soup.find('p')
            if p:
                desc = p.get_text()[:500]
        summary = (title + '. ' + desc).strip()
        return Response(json.dumps({'title': title, 'summary': summary}), mimetype='application/json')
    except Exception as e:
        return Response(json.dumps({'error': str(e)}), mimetype='application/json')


@app.route('/img-proxy')
def img_proxy():
    url = request.args.get('url', '')
    if not url or 'twimg.com' not in url:
        return Response('Invalid', status=400)
    try:
        resp = requests.get(url, headers={
            'Referer': 'https://twitter.com/',
            'User-Agent': 'Mozilla/5.0'
        }, timeout=10, stream=True)
        return Response(
            resp.content,
            status=resp.status_code,
            headers={'Content-Type': resp.headers.get('Content-Type', 'image/jpeg'),
                     'Cache-Control': 'public, max-age=3600'}
        )
    except Exception as e:
        return Response(str(e), status=500)

@app.route('/proxy/anthropic', methods=['POST', 'OPTIONS'])
def anthropic_proxy():
    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type, x-api-key, anthropic-version',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    }
    if request.method == 'OPTIONS':
        return Response('', 200, headers=cors_headers)
    import time
    body_data = request.get_data()
    api_key = os.environ.get('ANTHROPIC_API_KEY', '')
    for attempt in range(3):
        try:
            resp = requests.post(
                'https://api.anthropic.com/v1/messages',
                headers={
                    'x-api-key': api_key,
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json'
                },
                data=body_data,
                timeout=120
            )
            if resp.status_code == 429 and attempt < 2:
                print(f"429 rate limit, retrying in {10 * (attempt + 1)}s...", flush=True)
                time.sleep(10 * (attempt + 1))
                continue
            cors_headers['Content-Type'] = 'application/json'
            if resp.status_code != 200:
                print(f"Anthropic error {resp.status_code}: {resp.text}", flush=True)
            return Response(resp.content, status=resp.status_code, headers=cors_headers)
        except Exception as e:
            if attempt == 2:
                cors_headers['Content-Type'] = 'application/json'
                return Response(f'{{"error": "{str(e)}"}}', status=500, headers=cors_headers)
            time.sleep(5)
    cors_headers['Content-Type'] = 'application/json'
    return Response('{"error": "Max retries exceeded"}', status=429, headers=cors_headers)

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
