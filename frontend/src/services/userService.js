const API_BASE_URL = "http://localhost:5000/api";

/**
 * Obtiene la lista de usuarios desde el backend Flask.
 * @returns {Promise<Array<{id: number, nombre: string}>>}
 */
export async function fetchUsuarios() {
  const response = await fetch(`${API_BASE_URL}/usuarios`);
  if (!response.ok) {
    throw new Error(`Error en la petición: ${response.status} ${response.statusText}`);
  }
  return response.json();
}
