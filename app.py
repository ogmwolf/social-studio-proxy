import requests
from flask import Flask, request, Response

app = Flask(__name__)

@app.route('/', defaults={'path': ''}, methods=['GET', 'OPTIONS'])
@app.route('/<path:path>', methods=['GET', 'OPTIONS'])
def proxy(path):
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
    }
    if request.method == 'OPTIONS':
        return Response('', 200, headers)
    
    url = f'https://api.twitter.com/{path}'
    auth = request.headers.get('Authorization', '')
    resp = requests.get(url, headers={'Authorization': auth}, params=request.args)
    headers['Content-Type'] = 'application/json'
    return Response(resp.content, status=resp.status_code, headers=headers)

if __name__ == '__main__':
    app.run()
