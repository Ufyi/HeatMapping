import cv2
import numpy as np

def get_contrast_map(image):
    # 画像をグレースケールに変換
    gray = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2GRAY)

    # コントラストを計算するためにCLAHE（適応的ヒストグラム平坦化）を使用してコントラストを強調
    # CLAHEは、画像のコントラストを改善するための手法で、微細なコントラストを強調。
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    contrast = clahe.apply(gray)

    # コントラストマップをヒートマップとして表示
    heatmap = cv2.applyColorMap(contrast, cv2.COLORMAP_JET)
    return heatmap