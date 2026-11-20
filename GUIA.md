# Guía de Conexión y Ejecución: Backend (Flask) + Frontend (React / Vite)

Esta guía explica la estructura, configuración y puesta en marcha del proyecto que comunica un backend en **Python con Flask** y un frontend en **React con Vite**, respetando la arquitectura preexistente del repositorio.

---

## 1. Estructura de Carpetas

Dentro del repositorio, se organizan ambos proyectos de forma desacoplada pero integrados en la misma raíz:

```plaintext
hackatonCDTM26/
├── backend/                # Servidor en Python con Flask
│   ├── app.py              # Definición de servidor, configuración de CORS y endpoints
│   └── requirements.txt    # Dependencias de Python (flask, flask-cors)
│
├── frontend/               # Aplicación cliente con React + Vite
│   ├── src/
│   │   ├── components/     # Componentes visuales reutilizables (ej. UserCard)
│   │   ├── services/       # Funciones modulares para interactuar con la API
│   │   ├── App.jsx         # Vista principal y consumo de endpoints
│   │   ├── App.css         # Estilos específicos de la interfaz
│   │   ├── index.css       # Estilos globales
│   │   └── main.jsx        # Punto de entrada de React
│   ├── index.html          # Documento HTML base para Vite
│   ├── vite.config.js      # Configuración de Vite (puerto 5173, plugins)
│   └── package.json        # Dependencias de Node.js y scripts de ejecución
│
├── GUIA.md                 # Esta guía de uso y documentación
├── AGENTS.md               # Instrucciones de agentes (sin modificar)
├── context/                # Contexto del proyecto y hackathon (sin modificar)
├── orchestration/          # Orquestación de agentes (sin modificar)
└── adapters/               # Adaptadores para herramientas externas (sin modificar)
```

---

## 2. Conexión y Comunicación entre Endpoints

El frontend y el backend corren en procesos y puertos separados en desarrollo:
* **Backend (Flask):** Corre por defecto en `http://localhost:5000`
* **Frontend (React + Vite):** Corre por defecto en `http://localhost:5173`

La comunicación se realiza mediante peticiones HTTP enviando y recibiendo datos en formato JSON.

### Habilitación de CORS en el Backend (`backend/app.py`)
Dado que el navegador aplica la política del mismo origen (Same-Origin Policy), se utiliza `flask-cors` para autorizar las peticiones provenientes del cliente React:

```python
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Permite peticiones desde React (http://localhost:5173)

@app.route("/api/usuarios", methods=["GET"])
def obtener_usuarios():
    return jsonify([{"id": 1, "nombre": "Ana"}])

if __name__ == "__main__":
    app.run(debug=True, port=5000)
```

### Petición desde el Frontend (`frontend/src/App.jsx`)
En el cliente, se utiliza `fetch` dentro de un hook `useEffect` para solicitar la información al servidor de Flask al cargar el componente:

```javascript
useEffect(() => {
  fetch("http://localhost:5000/api/usuarios")
    .then(res => res.json())
    .then(data => setUsuarios(data))
    .catch(err => console.error("Error al obtener usuarios:", err));
}, []);
```

También se incluye un servicio modular en `frontend/src/services/userService.js` para desacoplar las llamadas a la API de la vista si se requiere escalar el proyecto.

---

## 3. Puesta en Marcha

Se recomienda abrir dos terminales independientes: una para el backend y otra para el frontend.

### Terminal 1: Backend (Flask)

1. **Navegar a la carpeta del backend:**
   ```bash
   cd backend
   ```

2. **(Opcional pero recomendado) Crear y activar un entorno virtual:**
   * En Windows:
     ```bash
     python -m venv venv
     .\venv\Scripts\activate
     ```
   * En Linux / macOS:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. **Instalar dependencias:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Iniciar el servidor Flask:**
   ```bash
   python app.py
   ```

   El servidor quedará disponible en: `http://localhost:5000`  
   Endpoint de prueba: `http://localhost:5000/api/usuarios`

---

### Terminal 2: Frontend (React con Vite)

1. **Navegar a la carpeta del frontend:**
   ```bash
   cd frontend
   ```

2. **Instalar las dependencias de Node.js:**
   ```bash
   npm install
   ```

3. **Iniciar el servidor de desarrollo Vite:**
   ```bash
   npm run dev
   ```

4. **Abrir en el navegador:**
   Visita `http://localhost:5173` para ver la interfaz interactuando con el backend.

---

## 4. Solución de Problemas Frecuentes

1. **Error de CORS (`Cross-Origin Request Blocked`):**
   * Verifica que `flask-cors` esté instalado y que `CORS(app)` esté declarado en `backend/app.py`.
2. **Puerto 5000 ocupado:**
   * En macOS Monterey o posterior, el servicio AirPlay Receiver puede escuchar en el puerto 5000. Si esto ocurre, desactiva AirPlay Receiver en la configuración del sistema o cambia el puerto en `app.py` y en las peticiones del frontend.
3. **Petición rechazada (`Failed to fetch`):**
   * Asegúrate de que el backend Flask esté en ejecución antes o mientras usas el frontend.
