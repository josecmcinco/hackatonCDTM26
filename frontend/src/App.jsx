import { useState, useEffect } from 'react';
import { UserCard } from './components/UserCard';
import './App.css';

function App() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/usuarios")
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        setUsuarios(data);
        setCargando(false);
      })
      .catch(err => {
        console.error("Error al obtener usuarios:", err);
        setError(err.message);
        setCargando(false);
      });
  }, []);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Conexión React (Vite) + Flask</h1>
        <p>Comunicación vía HTTP con JSON y CORS habilitado</p>
      </header>

      <main className="app-main">
        <section className="users-section">
          <h2>Lista de Usuarios desde Flask (<code>/api/usuarios</code>)</h2>

          {cargando && (
            <p className="status-msg">Cargando usuarios desde http://localhost:5000/api/usuarios...</p>
          )}

          {error && (
            <div className="error-box">
              <p><strong>Error de conexión:</strong> {error}</p>
              <p>Asegúrate de que el backend en Flask esté corriendo en <code>http://localhost:5000</code>.</p>
            </div>
          )}

          {!cargando && !error && usuarios.length === 0 && (
            <p className="status-msg">No se encontraron usuarios.</p>
          )}

          <div className="cards-grid">
            {usuarios.map(usuario => (
              <UserCard key={usuario.id} usuario={usuario} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
