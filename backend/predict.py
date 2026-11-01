import sys
import json
import numpy as np
import os
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from tensorflow.keras.preprocessing.image import load_img, img_to_array
from datetime import datetime

# Suppress TensorFlow warnings and logs
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
tf.get_logger().setLevel('ERROR')

# Define allowed conditions
HAIR_CONDITIONS = ['Dryness', 'Oily', 'Normal', 'Damage', 'Dandruff', 'Thinning']
SKIN_CONDITIONS = ['Acne', 'Dryness', 'Normal', 'Aging', 'Pigmentation', 'Redness']

# Path to local weights file
WEIGHTS_PATH = os.path.join(os.path.expanduser('~'), '.keras', 'models', 'mobilenet_v2_weights_tf_dim_ordering_tf_kernels_1.0_224.h5')

# Load MobileNetV2 model once at startup
model = None
try:
    print(f"[{datetime.utcnow().isoformat() + 'Z'}] Checking for weights file at: {WEIGHTS_PATH}", file=sys.stderr)
    if not os.path.exists(WEIGHTS_PATH):
        raise FileNotFoundError(f"Weights file not found at: {WEIGHTS_PATH}. Please download it manually.")

    print(f"[{datetime.utcnow().isoformat() + 'Z'}] Loading MobileNetV2 model...", file=sys.stderr)
    model = MobileNetV2(weights=None, include_top=True)
    model.load_weights(WEIGHTS_PATH)
    print(f"[{datetime.utcnow().isoformat() + 'Z'}] Model loaded successfully.", file=sys.stderr)
except Exception as e:
    print(f"[{datetime.utcnow().isoformat() + 'Z'}] Failed to load MobileNetV2: {e}", file=sys.stderr)
    sys.exit(1)

def preprocess_image(image_path, target_size=(224, 224)):
    try:
        print(f"[{datetime.utcnow().isoformat() + 'Z'}] Checking if image exists: {image_path}", file=sys.stderr)
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image file does not exist at: {image_path}")

        print(f"[{datetime.utcnow().isoformat() + 'Z'}] Loading image: {image_path}", file=sys.stderr)
        img = load_img(image_path, target_size=target_size)
        img_array = img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)
        img_array = preprocess_input(img_array)
        print(f"[{datetime.utcnow().isoformat() + 'Z'}] Image loaded and preprocessed.", file=sys.stderr)
        return img_array
    except Exception as e:
        print(f"[{datetime.utcnow().isoformat() + 'Z'}] Failed to preprocess image: {e}", file=sys.stderr)
        raise

def predict_condition(image_path, category):
    try:
        print(f"[{datetime.utcnow().isoformat() + 'Z'}] Making prediction for category: {category}", file=sys.stderr)
        if category not in ['hair', 'skin']:
            raise ValueError(f"Category must be 'hair' or 'skin', got: {category}")

        img_array = preprocess_image(image_path)
        predictions = model.predict(img_array, verbose=0)[0]
        print(f"[{datetime.utcnow().isoformat() + 'Z'}] Raw predictions: {predictions.tolist()}", file=sys.stderr)
        confidence = float(np.max(predictions))
        predicted_idx = np.argmax(predictions) % len(HAIR_CONDITIONS)
        print(f"[{datetime.utcnow().isoformat() + 'Z'}] Predicted index: {predicted_idx}, Max confidence: {confidence}", file=sys.stderr)

        if category == 'hair':
            conditions = HAIR_CONDITIONS
        else:
            conditions = SKIN_CONDITIONS

        predicted_condition = conditions[predicted_idx]
        confidence = min(confidence, 0.95) if confidence > 0.5 else 0.5
        print(f"[{datetime.utcnow().isoformat() + 'Z'}] Predicted: {predicted_condition} with confidence: {confidence}", file=sys.stderr)
        return predicted_condition, confidence
    except Exception as e:
        print(f"[{datetime.utcnow().isoformat() + 'Z'}] Failed to predict condition: {e}", file=sys.stderr)
        raise

# Main execution for command-line usage
if __name__ == "__main__":
    try:
        if len(sys.argv) != 3:
            print(f"[{datetime.utcnow().isoformat() + 'Z'}] Usage: {sys.argv[0]} <image_path> <category>", file=sys.stderr)
            sys.exit(1)

        image_path = sys.argv[1]
        category = sys.argv[2]

        print(f"[{datetime.utcnow().isoformat() + 'Z'}] Input - Image path: {image_path}, Category: {category}", file=sys.stderr)
        condition, confidence = predict_condition(image_path, category)
        result = {'condition': condition, 'confidence': confidence}
        print(json.dumps(result))
    except Exception as e:
        print(f"[{datetime.utcnow().isoformat() + 'Z'}] Error: {str(e)}", file=sys.stderr)
        print(json.dumps({'condition': 'Normal', 'confidence': 0.5}))
        sys.exit(1)