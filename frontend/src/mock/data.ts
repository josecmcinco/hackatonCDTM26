import {
  Opportunity,
  Profile,
  MatchResult,
  SkillDemandSupply,
  AuditLogEntry,
  HeatmapDatum,
  SankeyData,
  SkillAdjacencyNode,
  SkillAdjacencyEdge,
} from '../types';

export const SECTORS = [
  "Banca y Mercados",
  "Seguros",
  "Energía y Utilities",
  "Sector Público Estatal",
  "Sanidad y Farmacia",
  "Telecomunicaciones",
  "Retail y Gran Consumo",
  "Industria y Fabricación",
  "Automoción y Movilidad",
  "Logística y Transporte",
  "Turismo y Ocio",
  "Defensa y Seguridad",
  "Educación Superior",
  "Agroalimentario",
  "Medios y Contenidos",
  "Infraestructuras",
  "Real Estate y Proptech",
  "Servicios Profesionales",
  "Fintech",
  "Ciberseguridad",
  "Química y Materiales",
  "Aeroespacial",
  "Sector Público Regional",
  "Smart Cities",
  "Sostenibilidad y ESG"
];

// 14 Opportunities for Staffing Interno
export const STAFFING_OPPORTUNITIES: Opportunity[] = [
  {
    id: "opp-1",
    title: "Arquitecto Cloud y GenAI",
    client: "Banco Santander",
    sector: "Banca y Mercados",
    location: "Madrid",
    modality: "Híbrido",
    deadline: "2026-11-28",
    urgency: "critical",
    mustHaveSkills: ["AWS Architecture", "GenAI / LLMs", "Python", "Kubernetes", "API Design"],
    status: "open",
    bestMatchScore: 96,
    openedAt: "2026-11-10",
    description: "Diseño de la plataforma multicloud y arquitectura de casos de uso de IA Generativa para banca digital.",
    headcount: 3
  },
  {
    id: "opp-2",
    title: "Líder SAP S/4HANA Supply",
    client: "Repsol Digital",
    sector: "Energía y Utilities",
    location: "A Coruña",
    modality: "Híbrido",
    deadline: "2026-12-02",
    urgency: "critical",
    mustHaveSkills: ["SAP S/4HANA", "Logística MM/SD", "Supply Chain", "Gestión de Equipos"],
    status: "open",
    bestMatchScore: 94,
    openedAt: "2026-11-12",
    description: "Liderazgo funcional de la migración global del módulo de aprovisionamiento y cadena de suministro.",
    headcount: 2
  },
  {
    id: "opp-3",
    title: "Gobierno del Dato y AI Act",
    client: "Generalitat Valenciana",
    sector: "Sector Público Regional",
    location: "Valencia",
    modality: "Híbrido",
    deadline: "2026-11-30",
    urgency: "critical",
    mustHaveSkills: ["Gobierno del Dato", "AI Act Compliance", "Data Quality", "Collibra"],
    status: "open",
    bestMatchScore: 92,
    openedAt: "2026-11-08",
    description: "Adaptación del marco de gobernanza corporativo al reglamento europeo de IA y calidad analítica.",
    headcount: 2
  },
  {
    id: "opp-4",
    title: "Ingeniero MLOps & LLMOps",
    client: "Telefónica Tech",
    sector: "Telecomunicaciones",
    location: "Madrid",
    modality: "Remoto",
    deadline: "2026-12-05",
    urgency: "high",
    mustHaveSkills: ["MLflow", "Docker", "LangChain", "Azure ML", "CI/CD"],
    status: "matching",
    bestMatchScore: 89,
    openedAt: "2026-11-14",
    description: "Despliegue automatizado y monitorización de inferencia de modelos fundacionales a escala.",
    headcount: 2
  },
  {
    id: "opp-5",
    title: "Tech Lead Frontend React & Design Systems",
    client: "Inditex Technology",
    sector: "Retail y Gran Consumo",
    location: "A Coruña",
    modality: "Híbrido",
    deadline: "2026-12-10",
    urgency: "high",
    mustHaveSkills: ["React", "TypeScript", "Design Systems", "Web Performance", "Tailwind CSS"],
    status: "matching",
    bestMatchScore: 95,
    openedAt: "2026-11-15",
    description: "Evolución del sistema de diseño unificado y microfrontends para la plataforma omnicanal global.",
    headcount: 1
  },
  {
    id: "opp-6",
    title: "Especialista Ciberseguridad Cloud & Zero Trust",
    client: "Iberdrola Renovable",
    sector: "Energía y Utilities",
    location: "Bilbao",
    modality: "Híbrido",
    deadline: "2026-12-15",
    urgency: "high",
    mustHaveSkills: ["Cloud Security", "Zero Trust", "IAM", "ISO 27001", "Terraform"],
    status: "open",
    bestMatchScore: 88,
    openedAt: "2026-11-11",
    description: "Definición del perímetro de seguridad y políticas de identidad para infraestructura híbrida.",
    headcount: 2
  },
  {
    id: "opp-7",
    title: "Consultor Senior Salesforce Health Cloud",
    client: "Quirónsalud",
    sector: "Sanidad y Farmacia",
    location: "Barcelona",
    modality: "Híbrido",
    deadline: "2026-12-20",
    urgency: "medium",
    mustHaveSkills: ["Salesforce Health Cloud", "APEX", "Integraciones HL7", "OmniStudio"],
    status: "open",
    bestMatchScore: 86,
    openedAt: "2026-11-05",
    description: "Implantación de la gestión integrada de historias clínicas ambulatorias en Salesforce.",
    headcount: 1
  },
  {
    id: "opp-8",
    title: "Data Engineer Databricks & PySpark",
    client: "BBVA Next",
    sector: "Banca y Mercados",
    location: "Madrid",
    modality: "Remoto",
    deadline: "2026-12-22",
    urgency: "medium",
    mustHaveSkills: ["Databricks", "PySpark", "Delta Lake", "SQL Avanzado", "Azure"],
    status: "matching",
    bestMatchScore: 91,
    openedAt: "2026-11-16",
    description: "Construcción de canalizaciones de ingesta masiva en streaming para análisis de transacciones.",
    headcount: 3
  },
  {
    id: "opp-9",
    title: "Product Manager Digital Workplace",
    client: "SEAT S.A.",
    sector: "Automoción y Movilidad",
    location: "Barcelona",
    modality: "Presencial",
    deadline: "2026-12-28",
    urgency: "medium",
    mustHaveSkills: ["Agile/Scrum", "Product Roadmap", "M365 Copilot", "Change Management"],
    status: "open",
    bestMatchScore: 84,
    openedAt: "2026-11-03",
    description: "Gestión de la experiencia del empleado y adopción de herramientas de productividad con IA.",
    headcount: 1
  },
  {
    id: "opp-10",
    title: "Arquitecto Modernización Legacy COBOL to Java",
    client: "CaixaBank Tech",
    sector: "Fintech",
    location: "Barcelona",
    modality: "Híbrido",
    deadline: "2026-12-18",
    urgency: "critical",
    mustHaveSkills: ["Mainframe COBOL", "Java Spring Boot", "Microservicios", "Arquitectura Hexagonal"],
    status: "open",
    bestMatchScore: 97,
    openedAt: "2026-11-13",
    description: "Refactorización y migración gradual del core bancario crítico hacia microservicios en contenedor.",
    headcount: 2
  },
  {
    id: "opp-11",
    title: "Auditor Técnico ESG y Huella de Carbono",
    client: "Ferrovial Agroman",
    sector: "Infraestructuras",
    location: "Madrid",
    modality: "Híbrido",
    deadline: "2027-01-10",
    urgency: "low",
    mustHaveSkills: ["ESG Analytics", "GHG Protocol", "PowerBI", "Python Data"],
    status: "open",
    bestMatchScore: 82,
    openedAt: "2026-11-01",
    description: "Cuadro de mando analítico para medición de emisiones Scope 1, 2 y 3 en obra civil.",
    headcount: 1
  },
  {
    id: "opp-12",
    title: "Especialista DevOps & Platform Engineering",
    client: "Logista España",
    sector: "Logística y Transporte",
    location: "Madrid",
    modality: "Remoto",
    deadline: "2026-12-14",
    urgency: "high",
    mustHaveSkills: ["Kubernetes", "ArgoCD", "Helm", "GitOps", "Prometheus"],
    status: "shortlist",
    bestMatchScore: 93,
    openedAt: "2026-11-07",
    description: "Creación de la Internal Developer Platform (IDP) para agilizar entregas continuas.",
    headcount: 2
  },
  {
    id: "opp-13",
    title: "Consultor Estratégico AI Act y Compliance",
    client: "Ministerio para la Transformación Digital",
    sector: "Sector Público Estatal",
    location: "Madrid",
    modality: "Presencial",
    deadline: "2026-12-12",
    urgency: "high",
    mustHaveSkills: ["AI Act", "Auditoría Algorítmica", "Regulación UE", "Gestión de Riesgos"],
    status: "shortlist",
    bestMatchScore: 90,
    openedAt: "2026-11-09",
    description: "Elaboración de guías técnicas y evaluación de riesgos en sistemas de alto impacto.",
    headcount: 1
  },
  {
    id: "opp-14",
    title: "Desarrollador IoT & Edge Computing",
    client: "Navantia Sea",
    sector: "Defensa y Seguridad",
    location: "Cartagena",
    modality: "Presencial",
    deadline: "2027-01-15",
    urgency: "low",
    mustHaveSkills: ["C++", "MQTT", "Edge Computing", "Linux Embedded", "Docker"],
    status: "open",
    bestMatchScore: 85,
    openedAt: "2026-11-02",
    description: "Telemetría y monitorización en tiempo real de subsistemas de navegación marítima.",
    headcount: 2
  }
];

// ~40 Profiles for Staffing Interno
export const STAFFING_PROFILES: Profile[] = [
  {
    id: "prof-1",
    name: "Elena Morales Vega",
    initials: "EM",
    role: "Senior Cloud & AI Architect",
    seniority: "Lead",
    unit: "Cloud & Data Engineering",
    availability: "Inmediata",
    hiddenTalentFlag: false,
    skills: [
      { name: "AWS Architecture", level: 5, evidenceCount: 14 },
      { name: "GenAI / LLMs", level: 4, evidenceCount: 6 },
      { name: "Python", level: 5, evidenceCount: 18 },
      { name: "Kubernetes", level: 4, evidenceCount: 9 },
      { name: "API Design", level: 5, evidenceCount: 12 }
    ],
    evidence: [
      { text: "Diseño de arquitectura RAG enterprise en AWS Bedrock con OpenSearch", year: 2026, project: "Plataforma IA Banca Privada" },
      { text: "Migración de 45 microservicios a clúster EKS con zero-downtime", year: 2025, project: "Modernización Core Aseguradora" },
      { text: "Certificación AWS Solutions Architect Professional renovada", year: 2025, project: "Capacitación Corporativa" }
    ]
  },
  {
    id: "prof-2",
    name: "Carlos Benítez Salcedo",
    initials: "CB",
    role: "Principal Modernization Consultant",
    seniority: "Principal",
    unit: "Enterprise Applications",
    availability: "2 semanas",
    hiddenTalentFlag: true,
    skills: [
      { name: "Mainframe COBOL", level: 5, evidenceCount: 22 },
      { name: "Java Spring Boot", level: 4, evidenceCount: 8 },
      { name: "Microservicios", level: 4, evidenceCount: 7 },
      { name: "Arquitectura Hexagonal", level: 4, evidenceCount: 5 },
      { name: "Cloud Migration", level: 4, evidenceCount: 6 }
    ],
    evidence: [
      { text: "Lideró el desacoplamiento de transacciones CICS hacia servicios Spring Cloud", year: 2025, project: "Transformación Banco Ibérico" },
      { text: "20 años de dominio de reglas de negocio en COBOL bancario acelerando el mapping de datos", year: 2024, project: "Auditoría Legacy" }
    ]
  },
  {
    id: "prof-3",
    name: "Lucía Domínguez Rey",
    initials: "LD",
    role: "Lead SAP S/4HANA Consultant",
    seniority: "Lead",
    unit: "Enterprise Solutions",
    availability: "Inmediata",
    hiddenTalentFlag: false,
    skills: [
      { name: "SAP S/4HANA", level: 5, evidenceCount: 16 },
      { name: "Logística MM/SD", level: 5, evidenceCount: 19 },
      { name: "Supply Chain", level: 4, evidenceCount: 11 },
      { name: "Gestión de Equipos", level: 4, evidenceCount: 10 }
    ],
    evidence: [
      { text: "Despliegue global de S/4HANA Supply Chain en 4 centros logísticos de refino", year: 2025, project: "Energía Verde Global" },
      { text: "Gestión directa de un equipo funcional y técnico de 14 consultores", year: 2024, project: "Rollout Logística Iberia" }
    ]
  },
  {
    id: "prof-4",
    name: "Javier Ortiz Navarro",
    initials: "JO",
    role: "Senior Data Governance & Ethics Specialist",
    seniority: "Senior",
    unit: "Data Strategy & Governance",
    availability: "1 mes",
    hiddenTalentFlag: false,
    skills: [
      { name: "Gobierno del Dato", level: 5, evidenceCount: 13 },
      { name: "AI Act Compliance", level: 4, evidenceCount: 7 },
      { name: "Data Quality", level: 5, evidenceCount: 15 },
      { name: "Collibra", level: 4, evidenceCount: 8 }
    ],
    evidence: [
      { text: "Implantación de catálogo Collibra para 1.200 activos de información sensibles", year: 2026, project: "Data Governance Sanidad" },
      { text: "Coautor del marco metodológico de evaluación de sesgo algorítmico", year: 2025, project: "Observatorio IA Ética" }
    ]
  },
  {
    id: "prof-5",
    name: "Sara Gallego Prieto",
    initials: "SG",
    role: "MLOps & Platform Engineer",
    seniority: "Senior",
    unit: "Cloud & Data Engineering",
    availability: "Inmediata",
    hiddenTalentFlag: true,
    skills: [
      { name: "MLflow", level: 4, evidenceCount: 9 },
      { name: "Docker", level: 5, evidenceCount: 16 },
      { name: "LangChain", level: 4, evidenceCount: 6 },
      { name: "Kubernetes", level: 5, evidenceCount: 12 },
      { name: "CI/CD", level: 5, evidenceCount: 14 }
    ],
    evidence: [
      { text: "Automatización de pipeline de reentrenamiento continuo con MLflow y Kubeflow", year: 2026, project: "Telco Churn Prediction" },
      { text: "Transición de DevOps tradicional a LLMOps optimizando costes de GPU en un 38%", year: 2025, project: "Plataforma GenAI Telco" }
    ]
  },
  {
    id: "prof-6",
    name: "Mateo Rivas Lozano",
    initials: "MR",
    role: "Staff Frontend Architect",
    seniority: "Lead",
    unit: "Digital Experience",
    availability: "Inmediata",
    hiddenTalentFlag: false,
    skills: [
      { name: "React", level: 5, evidenceCount: 20 },
      { name: "TypeScript", level: 5, evidenceCount: 18 },
      { name: "Design Systems", level: 5, evidenceCount: 11 },
      { name: "Web Performance", level: 5, evidenceCount: 13 },
      { name: "Tailwind CSS", level: 5, evidenceCount: 10 }
    ],
    evidence: [
      { text: "Arquitectura del Design System multimarca adoptado por 9 equipos de producto", year: 2026, project: "Retail Portal Global" },
      { text: "Mejora de Core Web Vitals (LCP de 3.2s a 0.8s) en checkout de alta concurrencia", year: 2025, project: "E-Commerce Flagship" }
    ]
  },
  {
    id: "prof-7",
    name: "Andrea Soler Garrido",
    initials: "AS",
    role: "Senior Security Specialist",
    seniority: "Senior",
    unit: "Cybersecurity & Risk",
    availability: "2 semanas",
    hiddenTalentFlag: false,
    skills: [
      { name: "Cloud Security", level: 5, evidenceCount: 12 },
      { name: "Zero Trust", level: 4, evidenceCount: 8 },
      { name: "Terraform", level: 4, evidenceCount: 9 },
      { name: "ISO 27001", level: 4, evidenceCount: 7 }
    ],
    evidence: [
      { text: "Auditoría y fortificación de landing zones en AWS y Azure según CIS Benchmarks", year: 2026, project: "SecOps Utilities" }
    ]
  },
  {
    id: "prof-8",
    name: "David Crespo Mendoza",
    initials: "DC",
    role: "Senior Databricks Engineer",
    seniority: "Senior",
    unit: "Cloud & Data Engineering",
    availability: "Inmediata",
    hiddenTalentFlag: false,
    skills: [
      { name: "Databricks", level: 5, evidenceCount: 14 },
      { name: "PySpark", level: 5, evidenceCount: 17 },
      { name: "Delta Lake", level: 4, evidenceCount: 10 },
      { name: "SQL Avanzado", level: 5, evidenceCount: 21 }
    ],
    evidence: [
      { text: "Diseño de lakehouse para ingesta de 4 TB/día con streaming delta tables", year: 2025, project: "Fraude Transaccional Banca" }
    ]
  },
  {
    id: "prof-9",
    name: "Irene Montes Ramos",
    initials: "IM",
    role: "Salesforce Solutions Specialist",
    seniority: "Mid",
    unit: "Enterprise Applications",
    availability: "3 semanas",
    hiddenTalentFlag: true,
    skills: [
      { name: "Salesforce Health Cloud", level: 4, evidenceCount: 7 },
      { name: "APEX", level: 4, evidenceCount: 9 },
      { name: "Integraciones HL7", level: 3, evidenceCount: 4 },
      { name: "OmniStudio", level: 4, evidenceCount: 6 }
    ],
    evidence: [
      { text: "Adaptación de flujos de triaje clínico de urgencias sobre Salesforce Service Cloud", year: 2025, project: "Portal Paciente Sanitas" }
    ]
  },
  {
    id: "prof-10",
    name: "Hugo Pardo Blanco",
    initials: "HP",
    role: "Platform & DevOps Architect",
    seniority: "Lead",
    unit: "Cloud & Data Engineering",
    availability: "Inmediata",
    hiddenTalentFlag: false,
    skills: [
      { name: "Kubernetes", level: 5, evidenceCount: 22 },
      { name: "ArgoCD", level: 5, evidenceCount: 13 },
      { name: "Helm", level: 5, evidenceCount: 15 },
      { name: "GitOps", level: 5, evidenceCount: 11 }
    ],
    evidence: [
      { text: "Implementación de GitOps con ArgoCD para 120 clusters productivos multiregión", year: 2026, project: "Logística Conectada" }
    ]
  },
  // Additional profiles for depth
  {
    id: "prof-11",
    name: "Nuria Campos Vidal",
    initials: "NC",
    role: "Regulatory Compliance Lead",
    seniority: "Lead",
    unit: "Data Strategy & Governance",
    availability: "Inmediata",
    hiddenTalentFlag: false,
    skills: [
      { name: "AI Act", level: 5, evidenceCount: 12 },
      { name: "Auditoría Algorítmica", level: 4, evidenceCount: 8 },
      { name: "Regulación UE", level: 5, evidenceCount: 14 }
    ],
    evidence: [
      { text: "Informe técnico de impacto y conformidad para sistemas de IA en contratación pública", year: 2026, project: "Ministerio Transformación" }
    ]
  },
  {
    id: "prof-12",
    name: "Gonzalo Varela Soto",
    initials: "GV",
    role: "Embedded & Edge Developer",
    seniority: "Senior",
    unit: "IoT & Industry 4.0",
    availability: "1 mes",
    hiddenTalentFlag: false,
    skills: [
      { name: "C++", level: 5, evidenceCount: 16 },
      { name: "MQTT", level: 4, evidenceCount: 9 },
      { name: "Edge Computing", level: 4, evidenceCount: 8 }
    ],
    evidence: [
      { text: "Desarrollo del firmware de telemetría de sensores acústicos en plataforma de defensa", year: 2025, project: "Fragata F110" }
    ]
  },
  {
    id: "prof-13",
    name: "Beatriz Marín Torres",
    initials: "BM",
    role: "Cloud Data Engineer",
    seniority: "Mid",
    unit: "Cloud & Data Engineering",
    availability: "Inmediata",
    hiddenTalentFlag: false,
    skills: [
      { name: "AWS Architecture", level: 4, evidenceCount: 7 },
      { name: "Python", level: 4, evidenceCount: 10 },
      { name: "Kubernetes", level: 3, evidenceCount: 5 }
    ],
    evidence: [
      { text: "Canalizaciones de datos en AWS Glue y Lambda para reporting diario", year: 2025, project: "Banca Minorista" }
    ]
  },
  {
    id: "prof-14",
    name: "Raúl Ibáñez Castillo",
    initials: "RI",
    role: "Senior Java & Cloud Specialist",
    seniority: "Senior",
    unit: "Enterprise Applications",
    availability: "2 semanas",
    hiddenTalentFlag: true,
    skills: [
      { name: "Java Spring Boot", level: 5, evidenceCount: 18 },
      { name: "Microservicios", level: 5, evidenceCount: 14 },
      { name: "Mainframe COBOL", level: 3, evidenceCount: 4 }
    ],
    evidence: [
      { text: "Desacoplamiento de interfaces CICS con conectores Kafka en arquitectura orientada a eventos", year: 2025, project: "Migración Pasarela Pagos" }
    ]
  },
  {
    id: "prof-15",
    name: "Carmen Pascual Gil",
    initials: "CP",
    role: "Supply Chain Solutions Architect",
    seniority: "Senior",
    unit: "Enterprise Solutions",
    availability: "Inmediata",
    hiddenTalentFlag: false,
    skills: [
      { name: "SAP S/4HANA", level: 4, evidenceCount: 11 },
      { name: "Logística MM/SD", level: 4, evidenceCount: 12 },
      { name: "Supply Chain", level: 4, evidenceCount: 8 }
    ],
    evidence: [
      { text: "Integración de proveedores en SAP Ariba y S/4HANA para sector energético", year: 2025, project: "Petroquímica Norte" }
    ]
  }
];

// Top 3 match results per Opportunity (Realistic explainable AI matches)
export const MATCH_RESULTS_BY_OPPORTUNITY: Record<string, MatchResult[]> = {
  "opp-1": [
    {
      profileId: "prof-1",
      opportunityId: "opp-1",
      score: 96,
      reasons: [
        "Afinidad del 96% en arquitecturas RAG multicloud y modelos LLM en producción.",
        "Verificado en 14 proyectos bancarios con certificación oficial AWS Professional."
      ],
      radar: [
        { axis: "Cloud Architecture", profileValue: 95, requiredValue: 90 },
        { axis: "GenAI & LLMs", profileValue: 90, requiredValue: 85 },
        { axis: "Python / Data", profileValue: 98, requiredValue: 85 },
        { axis: "Kubernetes & Infra", profileValue: 88, requiredValue: 80 },
        { axis: "Banca & Regulación", profileValue: 92, requiredValue: 75 },
        { axis: "Disponibilidad", profileValue: 100, requiredValue: 90 }
      ],
      breakdown: [
        { factor: "Alineación técnica directa", percentage: 48, impact: "positive" },
        { factor: "Experiencia en sector Banca", percentage: 24, impact: "positive" },
        { factor: "Disponibilidad inmediata", percentage: 16, impact: "positive" },
        { factor: "Evidencias validadas en proyectos", percentage: 8, impact: "positive" }
      ],
      evidence: [
        { text: "Diseño de arquitectura RAG enterprise en AWS Bedrock con OpenSearch", year: 2026, project: "Plataforma IA Banca Privada" },
        { text: "Migración de 45 microservicios a clúster EKS con zero-downtime", year: 2025, project: "Modernización Core Aseguradora" },
        { text: "Certificación AWS Solutions Architect Professional renovada", year: 2025, project: "Capacitación Corporativa" }
      ],
      hiddenTalent: false,
      status: "pending"
    },
    {
      profileId: "prof-5",
      opportunityId: "opp-1",
      score: 89,
      reasons: [
        "Excelente solvencia en despliegues automatizados de LLMOps sobre Kubernetes.",
        "Talento oculto detectado: evolución rápida desde DevOps hacia optimización de inferencia."
      ],
      radar: [
        { axis: "Cloud Architecture", profileValue: 82, requiredValue: 90 },
        { axis: "GenAI & LLMs", profileValue: 85, requiredValue: 85 },
        { axis: "Python / Data", profileValue: 88, requiredValue: 85 },
        { axis: "Kubernetes & Infra", profileValue: 96, requiredValue: 80 },
        { axis: "Banca & Regulación", profileValue: 70, requiredValue: 75 },
        { axis: "Disponibilidad", profileValue: 100, requiredValue: 90 }
      ],
      breakdown: [
        { factor: "Infraestructura y Kubernetes", percentage: 42, impact: "positive" },
        { factor: "Conocimiento emergente GenAI", percentage: 30, impact: "positive" },
        { factor: "Disponibilidad", percentage: 17, impact: "positive" },
        { factor: "Dominio sectorial específico", percentage: -5, impact: "neutral" }
      ],
      evidence: [
        { text: "Automatización de pipeline de inferencia LLMOps con MLflow y Kubeflow", year: 2026, project: "Telco Churn Prediction" },
        { text: "Reducción de coste de inferencia GPU en un 38% mediante cuantización", year: 2025, project: "Plataforma GenAI Telco" }
      ],
      hiddenTalent: true,
      adjacentPath: {
        fromSkill: "DevOps & Kubernetes",
        bridge: "Contenedores de Inferencia y MLflow",
        toSkill: "GenAI & LLMs en Producción"
      },
      status: "pending"
    },
    {
      profileId: "prof-13",
      opportunityId: "opp-1",
      score: 83,
      reasons: [
        "Sólida base de ingeniería de datos en AWS y pipelines escalables con Python.",
        "Experiencia previa en entornos de banca minorista española."
      ],
      radar: [
        { axis: "Cloud Architecture", profileValue: 80, requiredValue: 90 },
        { axis: "GenAI & LLMs", profileValue: 72, requiredValue: 85 },
        { axis: "Python / Data", profileValue: 89, requiredValue: 85 },
        { axis: "Kubernetes & Infra", profileValue: 75, requiredValue: 80 },
        { axis: "Banca & Regulación", profileValue: 86, requiredValue: 75 },
        { axis: "Disponibilidad", profileValue: 100, requiredValue: 90 }
      ],
      breakdown: [
        { factor: "Experiencia técnica en AWS", percentage: 38, impact: "positive" },
        { factor: "Contexto bancario previo", percentage: 26, impact: "positive" },
        { factor: "Disponibilidad", percentage: 19, impact: "positive" },
        { factor: "Brecha en LLMs avanzados", percentage: -8, impact: "neutral" }
      ],
      evidence: [
        { text: "Canalizaciones de datos en AWS Glue y Lambda para reporting diario", year: 2025, project: "Banca Minorista" }
      ],
      hiddenTalent: false,
      status: "pending"
    }
  ],
  "opp-2": [
    {
      profileId: "prof-3",
      opportunityId: "opp-2",
      score: 94,
      reasons: [
        "Afinidad del 94% en S/4HANA Supply Chain y gestión de refinerías en Galicia.",
        "16 proyectos contrastados en integración logística con clientes del sector energético."
      ],
      radar: [
        { axis: "SAP S/4HANA", profileValue: 95, requiredValue: 90 },
        { axis: "Logística MM/SD", profileValue: 96, requiredValue: 90 },
        { axis: "Supply Chain", profileValue: 88, requiredValue: 85 },
        { axis: "Gestión Equipos", profileValue: 90, requiredValue: 80 },
        { axis: "Sector Energía", profileValue: 94, requiredValue: 75 },
        { axis: "Disponibilidad", profileValue: 100, requiredValue: 85 }
      ],
      breakdown: [
        { factor: "Dominio funcional S/4HANA", percentage: 46, impact: "positive" },
        { factor: "Experiencia en energía y refino", percentage: 28, impact: "positive" },
        { factor: "Liderazgo demostrado", percentage: 18, impact: "positive" }
      ],
      evidence: [
        { text: "Despliegue global de S/4HANA Supply Chain en 4 centros logísticos de refino", year: 2025, project: "Energía Verde Global" },
        { text: "Gestión directa de equipo de 14 consultores", year: 2024, project: "Rollout Logística Iberia" }
      ],
      hiddenTalent: false,
      status: "pending"
    },
    {
      profileId: "prof-15",
      opportunityId: "opp-2",
      score: 88,
      reasons: [
        "Amplia experiencia en aprovisionamiento y contratos marco de petróleo y gas.",
        "Disponibilidad inmediata para traslado a A Coruña."
      ],
      radar: [
        { axis: "SAP S/4HANA", profileValue: 85, requiredValue: 90 },
        { axis: "Logística MM/SD", profileValue: 88, requiredValue: 90 },
        { axis: "Supply Chain", profileValue: 84, requiredValue: 85 },
        { axis: "Gestión Equipos", profileValue: 78, requiredValue: 80 },
        { axis: "Sector Energía", profileValue: 90, requiredValue: 75 },
        { axis: "Disponibilidad", profileValue: 100, requiredValue: 85 }
      ],
      breakdown: [
        { factor: "Alineación SAP MM", percentage: 40, impact: "positive" },
        { factor: "Historial sectorial", percentage: 30, impact: "positive" },
        { factor: "Disponibilidad", percentage: 18, impact: "positive" }
      ],
      evidence: [
        { text: "Integración de proveedores en SAP Ariba y S/4HANA para sector energético", year: 2025, project: "Petroquímica Norte" }
      ],
      hiddenTalent: false,
      status: "pending"
    }
  ],
  "opp-10": [
    {
      profileId: "prof-2",
      opportunityId: "opp-10",
      score: 97,
      reasons: [
        "Afinidad del 97%: perfil dual único que domina Mainframe COBOL y arquitectura moderna Spring Boot.",
        "Talento oculto de alto impacto: desentraña reglas no documentadas en 40% menos tiempo."
      ],
      radar: [
        { axis: "Mainframe COBOL", profileValue: 98, requiredValue: 85 },
        { axis: "Java Spring Boot", profileValue: 88, requiredValue: 85 },
        { axis: "Microservicios", profileValue: 86, requiredValue: 85 },
        { axis: "Arquitectura Hexagonal", profileValue: 84, requiredValue: 80 },
        { axis: "Banca Transaccional", profileValue: 98, requiredValue: 90 },
        { axis: "Disponibilidad", profileValue: 90, requiredValue: 85 }
      ],
      breakdown: [
        { factor: "Conocimiento dual legacy/cloud", percentage: 55, impact: "positive" },
        { factor: "Experiencia en core bancario", percentage: 30, impact: "positive" },
        { factor: "Capacidad de mentoría técnica", percentage: 12, impact: "positive" }
      ],
      evidence: [
        { text: "Lideró el desacoplamiento de transacciones CICS hacia servicios Spring Cloud", year: 2025, project: "Transformación Banco Ibérico" },
        { text: "20 años de dominio de reglas de negocio en COBOL bancario acelerando el mapping", year: 2024, project: "Auditoría Legacy" }
      ],
      hiddenTalent: true,
      adjacentPath: {
        fromSkill: "COBOL & CICS Mainframe",
        bridge: "Migración de Transacciones Bancarias",
        toSkill: "Microservicios Java Cloud Native"
      },
      status: "pending"
    },
    {
      profileId: "prof-14",
      opportunityId: "opp-10",
      score: 91,
      reasons: [
        "Especialista en arquitecturas reactivas Java y desacoplamiento con Apache Kafka.",
        "Experiencia contrastada en pasarelas de pago de alta criticidad."
      ],
      radar: [
        { axis: "Mainframe COBOL", profileValue: 70, requiredValue: 85 },
        { axis: "Java Spring Boot", profileValue: 96, requiredValue: 85 },
        { axis: "Microservicios", profileValue: 94, requiredValue: 85 },
        { axis: "Arquitectura Hexagonal", profileValue: 90, requiredValue: 80 },
        { axis: "Banca Transaccional", profileValue: 92, requiredValue: 90 },
        { axis: "Disponibilidad", profileValue: 85, requiredValue: 85 }
      ],
      breakdown: [
        { factor: "Arquitectura moderna de microservicios", percentage: 48, impact: "positive" },
        { factor: "Integración orientada a eventos", percentage: 32, impact: "positive" },
        { factor: "Familiaridad con COBOL básico", percentage: 11, impact: "positive" }
      ],
      evidence: [
        { text: "Desacoplamiento de interfaces CICS con conectores Kafka en arquitectura orientada a eventos", year: 2025, project: "Migración Pasarela Pagos" }
      ],
      hiddenTalent: false,
      status: "pending"
    }
  ]
};

// Realistic Audit Log (20 rows)
export const INITIAL_AUDIT_LOG: AuditLogEntry[] = [
  {
    id: "log-1",
    actor: "Alba Ruiz (Staffing Manager)",
    action: "Aprobado",
    targetName: "Elena Morales Vega",
    opportunityTitle: "Arquitecto Cloud y GenAI",
    timestamp: "2026-11-20 18:30",
    note: "Perfil prioritario validado con el cliente Banco Santander."
  },
  {
    id: "log-2",
    actor: "Marcos Vilar (Talent Lead)",
    action: "Aprobado",
    targetName: "Carlos Benítez Salcedo",
    opportunityTitle: "Arquitecto Modernización Legacy COBOL to Java",
    timestamp: "2026-11-20 16:15",
    note: "Validada recomendación de talento oculto para acelerar el mapping bancario."
  },
  {
    id: "log-3",
    actor: "Alba Ruiz (Staffing Manager)",
    action: "Descartado",
    targetName: "Beatriz Marín Torres",
    opportunityTitle: "Arquitecto Cloud y GenAI",
    timestamp: "2026-11-20 14:02",
    note: "Se requiere mayor seniority en diseño de prompts y RAG para este rol."
  },
  {
    id: "log-4",
    actor: "Sistema / Auditoría",
    action: "Modo ciego activado",
    targetName: "Filtro Global",
    opportunityTitle: "Todas",
    timestamp: "2026-11-20 11:20",
    note: "Sesión de calibración sin sesgo de género o procedencia iniciada."
  },
  {
    id: "log-5",
    actor: "Lucía Santos (Recruiter)",
    action: "Aprobado",
    targetName: "Mateo Rivas Lozano",
    opportunityTitle: "Tech Lead Frontend React & Design Systems",
    timestamp: "2026-11-19 17:45",
    note: "Entrevista técnica favorable con equipo Inditex."
  },
  {
    id: "log-6",
    actor: "Alba Ruiz (Staffing Manager)",
    action: "Aprobado",
    targetName: "Lucía Domínguez Rey",
    opportunityTitle: "Líder SAP S/4HANA Supply",
    timestamp: "2026-11-19 12:10",
    note: "Confirmación de disponibilidad inmediata para despliegue en A Coruña."
  },
  {
    id: "log-7",
    actor: "David Serrano (Staffing Tech)",
    action: "Aprobado",
    targetName: "Hugo Pardo Blanco",
    opportunityTitle: "Especialista DevOps & Platform Engineering",
    timestamp: "2026-11-18 19:22",
    note: "Supera los requisitos en GitOps y Kubernetes."
  },
  {
    id: "log-8",
    actor: "David Serrano (Staffing Tech)",
    action: "Descartado",
    targetName: "Gonzalo Varela Soto",
    opportunityTitle: "Arquitecto Cloud y GenAI",
    timestamp: "2026-11-18 15:40",
    note: "Perfil orientado a firmware embebido, no compatible con arquitectura cloud."
  },
  {
    id: "log-9",
    actor: "Alba Ruiz (Staffing Manager)",
    action: "Aprobado",
    targetName: "Javier Ortiz Navarro",
    opportunityTitle: "Gobierno del Dato y AI Act",
    timestamp: "2026-11-18 10:15",
    note: "Acreditada solvencia en Collibra y marco regulatorio autonómico."
  },
  {
    id: "log-10",
    actor: "Marcos Vilar (Talent Lead)",
    action: "Aprobado",
    targetName: "Sara Gallego Prieto",
    opportunityTitle: "Ingeniero MLOps & LLMOps",
    timestamp: "2026-11-17 18:05",
    note: "Afinidad confirmada en optimización de inferencia en Telefónica."
  },
  {
    id: "log-11",
    actor: "Sistema / Auditoría",
    action: "Modo ciego desactivado",
    targetName: "Filtro Global",
    opportunityTitle: "Todas",
    timestamp: "2026-11-17 16:30",
    note: "Finalizada sesión de cribado ciego."
  },
  {
    id: "log-12",
    actor: "Alba Ruiz (Staffing Manager)",
    action: "Aprobado",
    targetName: "Andrea Soler Garrido",
    opportunityTitle: "Especialista Ciberseguridad Cloud & Zero Trust",
    timestamp: "2026-11-16 17:10",
    note: "Certificaciones CISSP y experiencia en utilities aprobadas."
  },
  {
    id: "log-13",
    actor: "David Serrano (Staffing Tech)",
    action: "Aprobado",
    targetName: "David Crespo Mendoza",
    opportunityTitle: "Data Engineer Databricks & PySpark",
    timestamp: "2026-11-16 11:55",
    note: "Experiencia clave en ingesta masiva bancaria validada."
  },
  {
    id: "log-14",
    actor: "Marcos Vilar (Talent Lead)",
    action: "Aprobado",
    targetName: "Nuria Campos Vidal",
    opportunityTitle: "Consultor Estratégico AI Act y Compliance",
    timestamp: "2026-11-15 16:20",
    note: "Perfil idóneo para interlocución con el Ministerio."
  },
  {
    id: "log-15",
    actor: "Lucía Santos (Recruiter)",
    action: "Descartado",
    targetName: "Irene Montes Ramos",
    opportunityTitle: "Líder SAP S/4HANA Supply",
    timestamp: "2026-11-15 14:10",
    note: "Experiencia especializada en Salesforce, no en ERP logístico SAP."
  },
  {
    id: "log-16",
    actor: "Alba Ruiz (Staffing Manager)",
    action: "Aprobado",
    targetName: "Raúl Ibáñez Castillo",
    opportunityTitle: "Arquitecto Modernización Legacy COBOL to Java",
    timestamp: "2026-11-14 18:40",
    note: "Segundo perfil complementario en arquitectura reactiva aprobado."
  },
  {
    id: "log-17",
    actor: "David Serrano (Staffing Tech)",
    action: "Aprobado",
    targetName: "Carmen Pascual Gil",
    opportunityTitle: "Líder SAP S/4HANA Supply",
    timestamp: "2026-11-14 10:30",
    note: "Respaldo funcional aprobado para el equipo de Repsol."
  },
  {
    id: "log-18",
    actor: "Marcos Vilar (Talent Lead)",
    action: "Descartado",
    targetName: "David Crespo Mendoza",
    opportunityTitle: "Tech Lead Frontend React & Design Systems",
    timestamp: "2026-11-13 16:15",
    note: "Descarte técnico por divergencia de especialidad backend/frontend."
  },
  {
    id: "log-19",
    actor: "Alba Ruiz (Staffing Manager)",
    action: "Aprobado",
    targetName: "Gonzalo Varela Soto",
    opportunityTitle: "Desarrollador IoT & Edge Computing",
    timestamp: "2026-11-13 11:20",
    note: "Acreditada experiencia en sistemas embebidos de defensa."
  },
  {
    id: "log-20",
    actor: "Sistema / Auditoría",
    action: "Modo ciego activado",
    targetName: "Filtro Global",
    opportunityTitle: "Todas",
    timestamp: "2026-11-12 09:00",
    note: "Inicio de ciclo de staffing de proyectos estratégicos Q4."
  }
];

// Aggregates: Demand vs Supply (Top 8 Diverging Bar Chart)
export const SKILL_DEMAND_SUPPLY: SkillDemandSupply[] = [
  { skill: "AWS Architecture", demand: 28, supply: 16, gap: -12, isHighlighted: true },
  { skill: "GenAI & LLMs", demand: 24, supply: 14, gap: -10 },
  { skill: "SAP S/4HANA", demand: 22, supply: 15, gap: -7 },
  { skill: "Databricks & PySpark", demand: 19, supply: 14, gap: -5 },
  { skill: "AI Act Compliance", demand: 16, supply: 8, gap: -8 },
  { skill: "Kubernetes & GitOps", demand: 21, supply: 18, gap: -3 },
  { skill: "React & TypeScript", demand: 18, supply: 22, gap: 4 },
  { skill: "Mainframe COBOL", demand: 12, supply: 15, gap: 3 }
];

// Heatmap Data: Skills x Business Units
export const SKILL_GAP_HEATMAP: HeatmapDatum[] = [
  {
    id: "Cloud & Data",
    data: [
      { x: "GenAI / LLMs", y: 92 },
      { x: "AWS Cloud", y: 88 },
      { x: "Databricks", y: 84 },
      { x: "AI Act", y: 70 },
      { x: "SAP S/4HANA", y: 25 },
      { x: "React / Web", y: 40 }
    ]
  },
  {
    id: "Enterprise Apps",
    data: [
      { x: "GenAI / LLMs", y: 45 },
      { x: "AWS Cloud", y: 60 },
      { x: "Databricks", y: 35 },
      { x: "AI Act", y: 55 },
      { x: "SAP S/4HANA", y: 94 },
      { x: "React / Web", y: 50 }
    ]
  },
  {
    id: "Digital Experience",
    data: [
      { x: "GenAI / LLMs", y: 65 },
      { x: "AWS Cloud", y: 50 },
      { x: "Databricks", y: 30 },
      { x: "AI Act", y: 40 },
      { x: "SAP S/4HANA", y: 20 },
      { x: "React / Web", y: 96 }
    ]
  },
  {
    id: "Data & Ethics",
    data: [
      { x: "GenAI / LLMs", y: 80 },
      { x: "AWS Cloud", y: 55 },
      { x: "Databricks", y: 78 },
      { x: "AI Act", y: 95 },
      { x: "SAP S/4HANA", y: 30 },
      { x: "React / Web", y: 25 }
    ]
  },
  {
    id: "Cybersecurity",
    data: [
      { x: "GenAI / LLMs", y: 60 },
      { x: "AWS Cloud", y: 82 },
      { x: "Databricks", y: 50 },
      { x: "AI Act", y: 75 },
      { x: "SAP S/4HANA", y: 30 },
      { x: "React / Web", y: 35 }
    ]
  }
];

// Sankey: Bench & Disponibles -> Proyectos & Áreas
export const SANKEY_DATA: SankeyData = {
  nodes: [
    { id: "Banquillo (Bench)" },
    { id: "Fin de Proyecto Q4" },
    { id: "Talento Oculto" },
    { id: "Banca y Seguros" },
    { id: "Energía y Utilities" },
    { id: "Sector Público" },
    { id: "Retail Global" }
  ],
  links: [
    { source: "Banquillo (Bench)", target: "Banca y Seguros", value: 16 },
    { source: "Banquillo (Bench)", target: "Energía y Utilities", value: 12 },
    { source: "Banquillo (Bench)", target: "Sector Público", value: 8 },
    { source: "Fin de Proyecto Q4", target: "Banca y Seguros", value: 10 },
    { source: "Fin de Proyecto Q4", target: "Retail Global", value: 14 },
    { source: "Talento Oculto", target: "Banca y Seguros", value: 7 },
    { source: "Talento Oculto", target: "Energía y Utilities", value: 5 }
  ]
};

// Skill Adjacency Graph Nodes and Edges
export const SKILL_ADJACENCY_NODES: SkillAdjacencyNode[] = [
  { id: "cobol", label: "Mainframe COBOL", type: "source", profilesCount: 15, category: "Legacy" },
  { id: "batch", label: "Procesamiento Batch & CICS", type: "source", profilesCount: 18, category: "Legacy" },
  { id: "bridge-migration", label: "Desacoplamiento & CDC", type: "bridge", profilesCount: 9, category: "Transición" },
  { id: "bridge-events", label: "Arquitectura Kafka / Eventos", type: "bridge", profilesCount: 12, category: "Transición" },
  { id: "java-microservices", label: "Microservicios Spring Boot", type: "required", profilesCount: 22, category: "Cloud Native" },
  { id: "cloud-native", label: "AWS / Azure Cloud Native", type: "required", profilesCount: 28, category: "Cloud Native" },
  { id: "devops", label: "DevOps & CI/CD", type: "source", profilesCount: 20, category: "Infra" },
  { id: "llmops", label: "Inferencia LLM & GPU", type: "bridge", profilesCount: 8, category: "Transición" },
  { id: "genai", label: "GenAI & LLMs", type: "required", profilesCount: 14, category: "IA Moderna" }
];

export const SKILL_ADJACENCY_EDGES: SkillAdjacencyEdge[] = [
  { id: "e1", source: "cobol", target: "bridge-migration", label: "Transición de reglas" },
  { id: "e2", source: "batch", target: "bridge-events", label: "Event-driven design" },
  { id: "e3", source: "bridge-migration", target: "java-microservices", label: "Refactorización" },
  { id: "e4", source: "bridge-events", target: "java-microservices", label: "Consumo de eventos" },
  { id: "e5", source: "java-microservices", target: "cloud-native", label: "Contenerización EKS" },
  { id: "e6", source: "devops", target: "llmops", label: "Evolución MLOps" },
  { id: "e7", source: "llmops", target: "genai", label: "Despliegue RAG" }
];

// Bias check metric by group for Guardrails
export const BIAS_METRICS = [
  { group: "Junior (<3 años)", selectionRate: 46, parityIndex: 0.98 },
  { group: "Mid (3-6 años)", selectionRate: 51, parityIndex: 1.02 },
  { group: "Senior (6-10 años)", selectionRate: 49, parityIndex: 1.00 },
  { group: "Lead / Principal (>10 años)", selectionRate: 48, parityIndex: 0.99 },
  { group: "Unidades Periféricas", selectionRate: 50, parityIndex: 1.01 },
  { group: "Unidades Centrales", selectionRate: 49, parityIndex: 1.00 }
];
