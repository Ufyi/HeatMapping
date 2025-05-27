'''
  → 画像 + モードを送信
  → Flaskが受信
  → 画像処理
  → 結果をBase64エンコード
  → JSONで返却
'''


from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import cv2
import numpy as np
from io import BytesIO
from PIL import Image

from processors.saliency import get_saliency_map
from processors.saturation import get_saturation_map
from processors.brightness import get_brightness_map
from processors.contrast import get_contrast_map

# Flaskアプリの初期設定
app = Flask(__name__) #flaskアプリのインスタンスを作成
CORS(app) #CORS(フロントとバックが別サーバーでも通信可能になる)を有効にする

#モードに応じた画像処理関数を選択する
def process_image(image, mode):
    if mode == 'brightness':
        return get_brightness_map(image)
    elif mode == 'saturation':
        return get_saturation_map(image)
    elif mode == 'saliency':
        return get_saliency_map(image)
    elif mode == 'contrast':
        return get_contrast_map(image)
    else:
        raise ValueError('Unknown mode')

#Flaskルート関数
@app.route('/process', methods=['POST']) #POST(リクエストのみ)メソッドで/processにアクセスされたときに実行される
def process_images():
    files = request.files.getlist('images')  
    mode = request.form['mode']

    results = []

    for file in files:
        image = Image.open(file.stream).convert('RGB') #画像をRGBに変換
        result = process_image(image, mode) #選択されたモードの画像処理を実行

        original_img = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR) #PILからOpenCV形式に変換
        blended = cv2.addWeighted(original_img, 0.5, result, 0.5, 0) #元の画像と処理後の画像をオーバーレイする

        _, buffer = cv2.imencode('.png', blended) #OpenCV形式からPNG形式に変換
        base64_image = base64.b64encode(buffer).decode('utf-8') #base64形式(テキストデータ)に変換
        results.append(base64_image)

    return jsonify({'images': results}) #JSON形式で返す(処理済み画像をフロントエンドに返す)

#サーバー起動
if __name__ == '__main__':
    app.run(debug=True) #デバッグモードで起動(エラーがあった場合に詳細な情報を表示する)
