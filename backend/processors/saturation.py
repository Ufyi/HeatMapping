import cv2
import numpy as np

def get_saturation_map(image):
    hsv = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2HSV)
    s_channel = hsv[:, :, 1] #hsv[:, :, 1]はSaturationチャンネルを取得。0で色相、2で明度。１つ目の:は全ての行、2つ目の:は列を指定している。
    heatmap = cv2.applyColorMap(s_channel, cv2.COLORMAP_JET)

    return heatmap
