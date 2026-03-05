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
    print(f"Forwarding to {url} with auth: {auth[:20]}...")
    try:
        resp = requests.get(url, headers={'Authorization': auth, 'User-Agent': 'SocialStudio/1.0'}, params=request.args, timeout=10)
        print(f"Twitter responded: {resp.status_code}")
        cors_headers['Content-Type'] = 'application/json'
        return Response(resp.content, status=resp.status_code, headers=cors_headers)
    except Exception as e:
        cors_headers['Content-Type'] = 'application/json'
        return Response(f'{{"error": "{str(e)}"}}', status=500, headers=cors_headers)
