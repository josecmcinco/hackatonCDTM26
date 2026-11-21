export type ImportanceLevel = 'critical' | 'high' | 'medium' | 'low';

export interface ProjectSearchRequest {
  description: string;
  projectImportance: ImportanceLevel;
}

export interface IdealProfile {
  roleId: string;
  roleName: string;
  inferredImportance: ImportanceLevel;
  area: string;
  seniority: string;
  minExperienceYears: number;
  sectorPrincipal: string;
  requiredSkills: string[];
  desirableSkills: string[];       // Requisitos descritos como "not essential" (no filtran)
  implicitRequirements: string[];  // Requisitos implícitos detectados (ej. experiencia bancaria)
  certifications: string[];
  modality: string;
  availabilityRequired: string;
  hardFilterSummary?: string;      // Filtros duros aplicados por código (ej. "≥ 3 años · En banca")
}

export interface RawSkill {
  skill: string;
  nivel: number; // 1..5 (from profiles.parquet)
  anios: number;
}

export interface RawCertification {
  nombre: string;
  anio: number;
}

export interface RawLanguage {
  idioma: string;
  nivel: string;
}

export interface RawStudy {
  nivel: string;
  titulo: string;
  institucion: string;
  anio_fin: number;
}

export interface RawProjectHistory {
  nombre: string;
  cliente_sector: string;
  anio: number;
  rol: string;
}

export interface DimensionDiffVsTop1 {
  experiencePct: number;     // % diferencia en anios_experiencia vs Top 1 (ej. +25, -22)
  skillsPct: number;         // % diferencia en nivel medio de skills vs Top 1
  certificationsPct: number; // % diferencia en cantidad de certificaciones vs Top 1
  seniorityPct: number;      // % diferencia en seniority vs Top 1
  overallScorePct: number;   // % diferencia en matchScore vs Top 1
}

export interface CandidateMatch {
  employee_id: string;
  nombre_completo: string;
  initials: string;
  // 1. Factor Técnico (desde CaseContext/profiles.parquet)
  area: string;
  rol: string;
  puesto_actual: string;
  nivel_seniority: string;
  anios_experiencia: number;
  anios_en_ntt: number;
  sector_principal: string;
  skills: RawSkill[];
  certificaciones: RawCertification[];
  metodologias: string[];
  habilidades_blandas: string[];
  estudios: RawStudy[];
  // 2. Factor Logístico (desde CaseContext/profiles.parquet)
  pais: string;
  ciudad: string;
  movilidad_internacional: boolean;
  disponibilidad: 'En banca' | 'Roll-off próximo (<3 meses)' | 'Asignado';
  modalidad_trabajo: string;
  idiomas: RawLanguage[];
  // 3. Factor Histórico & Campos Inferidos por el Backend
  rank?: number;             // 1 = Top 1, 2 = #2, etc.
  matchScore: number;        // 0..100
  matchReason: string;       // Fortaleza principal
  gaps: string[];            // Brechas detectadas explícitamente
  riskFlag?: string;         // Riesgo detectado
  proyectos: RawProjectHistory[];
  conformidadActual: number; // 0..100 (< 70 => "Open to change")
  isHiddenTalent: boolean;   // true => "Hidden talent detected" (en Factor Técnico)
  matchPartners: string[];   // Ex-compañeros de proyectos exitosos que hicieron match en otro rol => "Partner matched" (en Factor Histórico)
  removalRiskPct?: number;   // Riesgo (%) de quitar a esta persona de su puesto/proyecto actual (mostrado en Top 1)
  comparisonVsTop1?: DimensionDiffVsTop1; // Solo presente para candidatos #2, #3...
}

export interface BelbinRadarPoint {
  role: string;
  teamScore: number;
  benchmark: number;
}

export interface DimensionRadarPoint {
  dimension: string;
  teamScore: number;
  expected: number;
}

export interface FactorComplianceItem {
  dimension: 'Factor Técnico' | 'Factor Logístico' | 'Factor Histórico';
  factor: string;
  scorePct: number;
  isInferred?: boolean;
  calculationNote: string;
}

export interface TeamOverviewMetrics {
  belbinPerformancePct: number;
  expectedSuccessPct: number;
  belbinRadar: BelbinRadarPoint[];
  dimensionsRadar: DimensionRadarPoint[];
  factorCompliance: FactorComplianceItem[];
}

export interface RoleMatchGroup {
  roleId: string;
  roleName: string;
  inferredImportance: ImportanceLevel;
  matches: CandidateMatch[];
}

export interface ProjectSearchResponse {
  projectId: string;
  projectImportance: ImportanceLevel;
  idealProfiles: IdealProfile[];
  teamOverview: TeamOverviewMetrics;
  roleMatches: RoleMatchGroup[];
}
