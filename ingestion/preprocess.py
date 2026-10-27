"""
Image preprocessing to improve OCR accuracy on messy scans.
Common steps: grayscale, denoise, threshold (binarize), deskew.
"""

import cv2
import numpy as np
from PIL import Image


def preprocess_image(image: Image.Image) -> Image.Image:
    """
    Clean up an image before OCR: grayscale + denoise + threshold.
    Also attaches the unbinarized high-fidelity RGB image as `_raw_color_image`
    so Multimodal Vision LLMs (Gemini) can decipher handwritten cursive ink strokes
    and color stationery without destructive 1-bit binary thresholding.
    """
    orig_rgb = image.convert("RGB")
    img_array = np.array(orig_rgb)
    gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
    denoised = cv2.fastNlMeansDenoising(gray, h=10)
    _, binarized = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    result = Image.fromarray(binarized)
    result._raw_color_image = orig_rgb
    return result
