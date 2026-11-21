from flask import Flask, jsonify
from flask_cors import CORS
from controller import candidatos_bp, voice_bp, agente_bp, transcripcion_bp

app = Flask(__name__)
CORS(app)  # Permite peticiones desde React

# Registrar controladores
app.register_blueprint(candidatos_bp)
app.register_blueprint(voice_bp)
app.register_blueprint(agente_bp)
app.register_blueprint(transcripcion_bp)

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "ok", "service": "NTT DATA AI Talent Matcher Backend"}), 200

# Endpoint legado de prueba
@app.route("/api/usuarios", methods=["GET"])
def obtener_usuarios():
    return jsonify([{"id": 1, "nombre": "Ana"}])

if __name__ == "__main__":
    app.run(debug=True, port=5000)
