import { ProjectSearchRequest, ProjectSearchResponse, IdealProfile } from '../types';
import { generateMockProjectSearch } from '../mock/data';

const USE_MOCK = false; // Backend Flask activo en localhost:5000
const API_BASE_URL = 'http://localhost:5000/api';

function simulateLatency(ms = 500): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const api = {
  /**
   * Paso 1: Solo infiere los perfiles ideales (roles, skills, filtros duros)
   * sin buscar candidatos reales todavía.
   */
  async inferProfiles(payload: ProjectSearchRequest): Promise<IdealProfile[]> {
    if (USE_MOCK) {
      await simulateLatency(400);
      return generateMockProjectSearch(payload).idealProfiles;
    }

    const res = await fetch(`${API_BASE_URL}/projects/infer-profiles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Error del servidor: ${res.status}`);
    }

    const data = await res.json();
    return data.idealProfiles as IdealProfile[];
  },

  /**
   * Paso 2: Dado un payload (y opcionalmente los perfiles ya inferidos),
   * obtiene los candidatos reales del parquet para cada rol.
   */
  async searchMatches(
    payload: ProjectSearchRequest,
    idealProfiles?: IdealProfile[]
  ): Promise<ProjectSearchResponse> {
    if (USE_MOCK) {
      await simulateLatency(550);
      return generateMockProjectSearch(payload);
    }

    const body = idealProfiles
      ? { ...payload, idealProfiles }
      : payload;

    const res = await fetch(`${API_BASE_URL}/projects/search-matches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Error del servidor: ${res.status}`);
    }

    return res.json();
  },
};
