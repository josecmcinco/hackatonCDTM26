import { ProjectSearchRequest, ProjectSearchResponse } from '../types';
import { generateMockProjectSearch } from '../mock/data';

const USE_MOCK = true; // Cambiar a false cuando el backend Flask de José esté levantado
const API_BASE_URL = 'http://localhost:5000/api';

function simulateLatency(ms = 500): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const api = {
  /**
   * Envía la descripción del proyecto y su importancia para obtener:
   * 1) Los perfiles ideales inferidos (Ideal Profiles)
   * 2) Los candidatos emparejados por cada puesto (Matches)
   */
  async searchMatches(payload: ProjectSearchRequest): Promise<ProjectSearchResponse> {
    if (USE_MOCK) {
      await simulateLatency(550);
      return generateMockProjectSearch(payload);
    }

    // TODO: Endpoint real implementado por José en Flask
    const res = await fetch(`${API_BASE_URL}/projects/search-matches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Error del servidor: ${res.status}`);
    }

    return res.json();
  },
};
