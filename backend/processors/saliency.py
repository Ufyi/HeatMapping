import cv2
import numpy as np

def get_saliency_map(image):
    image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)# 画像をRGBからBGRに変換(OpenCVはBGR形式を使用するため)
    saliency = cv2.saliency.StaticSaliencySpectralResidual_create()#Spectral Residual法に基づくサリエンシー検出器を生成
    #この手法は「画像のフーリエ変換のスペクトル残差」を計算。
    #画像を「色や明るさの変化パターン（周波数）」の集合として分解し、「よくあるパターン」と「珍しいパターン」を比較。
    _, saliency_map = saliency.computeSaliency(image) #1変数目は無視、2変数目をサリエンシーマップとして代入

    saliency_map = (saliency_map * 255).astype("uint8")#マップを0～255の整数値に変換（ヒートマップ生成の前処理）
    heatmap = cv2.applyColorMap(saliency_map, cv2.COLORMAP_JET)

    return heatmap