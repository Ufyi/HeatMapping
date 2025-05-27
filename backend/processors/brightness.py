import cv2
import numpy as np

def get_brightness_map(image):
    gray = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2GRAY)# 画像をグレースケール(明るさのみ)に変換
    heatmap = cv2.applyColorMap(gray, cv2.COLORMAP_JET)#グレースケール画像をヒートマップ(JETカラーマップ)として表示
    return heatmap
