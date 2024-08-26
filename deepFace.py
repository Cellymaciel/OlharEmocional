from flask import Flask, request, jsonify
import base64
from io import BytesIO
from PIL import Image
from deepface import DeepFace
import numpy as np

app = Flask(__name__)

@app.route('/recognize', methods=['POST'])
def recognize():
    try:
        image_data = request.json.get('image')
        if not image_data:
            print("No image data provided")
            return jsonify({"error": "No image data provided"}), 400

        # Decodificar a imagem base64
        try:
            image = Image.open(BytesIO(base64.b64decode(image_data)))
        except Exception as e:
            print(f"Failed to decode image: {str(e)}")
            return jsonify({"error": f"Failed to decode image: {str(e)}"}), 500

        # Converter a imagem para um array numpy
        try:
            image_np = np.array(image)
        except Exception as e:
            print(f"Failed to convert image to numpy array: {str(e)}")
            return jsonify({"error": f"Failed to convert image to numpy array: {str(e)}"}), 500

        # Análise da emoção usando DeepFace
        try:
            results = DeepFace.analyze(image_np, actions=['emotion'], enforce_detection=False)
            
            # Exibir o resultado para depuração
            
            # Se o resultado for uma lista de dicionários
            if isinstance(results, list) and len(results) > 0:
                result = results[0]  # Pegando o primeiro item da lista
                if 'dominant_emotion' in result:
                    dominant_emotion = result['dominant_emotion']
                    print("Dominant emotion:", dominant_emotion)
                    return jsonify({"emotion": dominant_emotion}), 200
                else:
                    print("Dominant emotion not found in result")
                    return jsonify({"error": "Dominant emotion not found in result"}), 500
            else:
                print("Unexpected result format from DeepFace")
                return jsonify({"error": "Unexpected result format from DeepFace"}), 500

        except Exception as e:
            print(f"Emotion recognition failed: {str(e)}")
            return jsonify({"error": f"Emotion recognition failed: {str(e)}"}), 500

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
