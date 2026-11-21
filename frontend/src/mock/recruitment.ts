import {
  Opportunity,
  Profile,
  MatchResult
} from '../types';

export const RECRUITMENT_OPPORTUNITIES: Opportunity[] = [
  {
    id: "rec-1",
    title: "Especialista Senior en Ciberdefensa SOC",
    client: "Telefónica Tech Global",
    sector: "Ciberseguridad",
    location: "Madrid",
    modality: "Híbrido",
    deadline: "2026-12-15",
    urgency: "critical",
    mustHaveSkills: ["SIEM / Splunk", "Threat Hunting", "Incident Response", "EDR CrowdStrike"],
    status: "open",
    bestMatchScore: 95,
    openedAt: "2026-11-10",
    description: "Vacante para liderazgo técnico del equipo de respuesta a incidentes críticos en SOC 24/7.",
    headcount: 2
  },
  {
    id: "rec-2",
    title: "Senior Fullstack Engineer (Next.js / Node)",
    client: "BBVA Spark",
    sector: "Fintech",
    location: "Barcelona",
    modality: "Remoto",
    deadline: "2026-12-05",
    urgency: "high",
    mustHaveSkills: ["React / Next.js", "TypeScript", "Node.js", "PostgreSQL", "AWS"],
    status: "matching",
    bestMatchScore: 92,
    openedAt: "2026-11-12",
    description: "Construcción de productos digitales para startups y venture debt internacional.",
    headcount: 3
  },
  {
    id: "rec-3",
    title: "Consultor AI Act & Compliance Regulatorio",
    client: "Agencia Española de Supervisión de IA (AESIA)",
    sector: "Sector Público Estatal",
    location: "A Coruña",
    modality: "Presencial",
    deadline: "2026-12-01",
    urgency: "critical",
    mustHaveSkills: ["AI Act", "Auditoría de Algoritmos", "Derecho Digital", "Evaluación de Riesgos"],
    status: "open",
    bestMatchScore: 97,
    openedAt: "2026-11-08",
    description: "Evaluación de expedientes de sistemas de IA de alto riesgo e inspección técnica.",
    headcount: 2
  },
  {
    id: "rec-4",
    title: "Data Platform Architect Snowflake & DBT",
    client: "Mango Fashion",
    sector: "Retail y Gran Consumo",
    location: "Barcelona",
    modality: "Híbrido",
    deadline: "2026-12-20",
    urgency: "medium",
    mustHaveSkills: ["Snowflake", "DBT", "Airflow", "Python", "Data Modeling"],
    status: "open",
    bestMatchScore: 88,
    openedAt: "2026-11-04",
    description: "Modernización del almacén de datos corporativo con arquitectura Data Vault 2.0.",
    headcount: 1
  }
];

export const RECRUITMENT_PROFILES: Profile[] = [
  {
    id: "cand-1",
    name: "Guillermo Navarro Sáez",
    initials: "GN",
    role: "Senior Threat Hunter & SOC Specialist",
    seniority: "Senior",
    unit: "LinkedIn Direct Sourcing", // candidateSource
    availability: "Final Interview", // interviewStage
    hiddenTalentFlag: false,
    experienceYears: 8,
    skills: [
      { name: "SIEM / Splunk", level: 5, evidenceCount: 15 },
      { name: "Threat Hunting", level: 5, evidenceCount: 12 },
      { name: "Incident Response", level: 4, evidenceCount: 9 },
      { name: "EDR CrowdStrike", level: 5, evidenceCount: 11 }
    ],
    evidence: [
      { text: "Resolución de más de 30 incidentes de intrusión avanzada (APT)", year: 2025, project: "CERT Financiero" },
      { text: "Certificación GCIA y GCIH de SANS", year: 2024, project: "Certificaciones SANS" }
    ]
  },
  {
    id: "cand-2",
    name: "Miriam Alarcón Peña",
    initials: "MA",
    role: "Lead Fullstack & Cloud Developer",
    seniority: "Lead",
    unit: "Headhunting Boutique",
    availability: "Oferta Aceptada",
    hiddenTalentFlag: true,
    experienceYears: 10,
    skills: [
      { name: "React / Next.js", level: 5, evidenceCount: 18 },
      { name: "TypeScript", level: 5, evidenceCount: 16 },
      { name: "Node.js", level: 5, evidenceCount: 14 },
      { name: "PostgreSQL", level: 4, evidenceCount: 10 },
      { name: "AWS", level: 4, evidenceCount: 9 }
    ],
    evidence: [
      { text: "Lideró la arquitectura de la app Fintech con 500k MAU en Next.js App Router", year: 2025, project: "Neobanco Europeo" }
    ]
  },
  {
    id: "cand-3",
    name: "Dr. Víctor Castillo Montero",
    initials: "VC",
    role: "Auditor AI Act & Abogado Tecnológico",
    seniority: "Principal",
    unit: "Referral Empleado NTT",
    availability: "Entrevista Técnica",
    hiddenTalentFlag: false,
    experienceYears: 12,
    skills: [
      { name: "AI Act", level: 5, evidenceCount: 14 },
      { name: "Auditoría de Algoritmos", level: 5, evidenceCount: 11 },
      { name: "Derecho Digital", level: 5, evidenceCount: 20 },
      { name: "Evaluación de Riesgos", level: 4, evidenceCount: 8 }
    ],
    evidence: [
      { text: "Asesor legal y técnico en sandbox regulatorio europeo de IA", year: 2026, project: "Piloto Sandbox IA" }
    ]
  }
];

export const RECRUITMENT_MATCH_RESULTS: Record<string, MatchResult[]> = {
  "rec-1": [
    {
      profileId: "cand-1",
      opportunityId: "rec-1",
      score: 95,
      reasons: [
        "Afinidad del 95% en contención de amenazas complejas y plataformas EDR/SIEM.",
        "8 años de trayectoria validada en CERT del sector bancario español."
      ],
      radar: [
        { axis: "Threat Hunting", profileValue: 98, requiredValue: 85 },
        { axis: "SIEM & Splunk", profileValue: 95, requiredValue: 85 },
        { axis: "Incident Response", profileValue: 92, requiredValue: 85 },
        { axis: "EDR CrowdStrike", profileValue: 96, requiredValue: 80 },
        { axis: "Certificaciones", profileValue: 94, requiredValue: 75 },
        { axis: "Fit Cultural", profileValue: 90, requiredValue: 80 }
      ],
      breakdown: [
        { factor: "Alineación en herramientas críticas", percentage: 50, impact: "positive" },
        { factor: "Experiencia en incidentes reales", percentage: 30, impact: "positive" },
        { factor: "Disponibilidad en fase final", percentage: 15, impact: "positive" }
      ],
      evidence: [
        { text: "Resolución de más de 30 incidentes de intrusión avanzada (APT)", year: 2025, project: "CERT Financiero" }
      ],
      hiddenTalent: false,
      status: "pending"
    }
  ]
};
