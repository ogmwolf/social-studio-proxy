import requests
from flask import Flask, request, Response
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/2/<path:path>', methods=['GET', 'OPTIONS'])
def proxy(path):
    url = f'https://api.twitter.com/2/{path}'
    headers = {'Authorization': request.headers.get('Authorization')}
    resp = requests.get(url, headers=headers, params=request.args)
    return Response(resp.content, status=resp.status_code, content_type='application/json')

if __name__ == '__main__':
    app.run()
