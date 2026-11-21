export type AppMode = 'staffing' | 'recruitment';

export type Urgency = 'critical' | 'high' | 'medium' | 'low';

export type OpportunityStatus = 'open' | 'matching' | 'shortlist' | 'staffed';

export interface Skill {
  name: string;
  level: number; // 1-5
  evidenceCount: number;
}

export interface Evidence {
  text: string;
  year: number;
  project: string;
}

export interface Profile {
  id: string;
  name: string;
  initials: string;
  role: string;
  seniority: 'Junior' | 'Mid' | 'Senior' | 'Lead' | 'Principal';
  unit: string; // Business unit in staffing, candidate source in recruitment
  availability: string; // Availability date/status or interview stage
  skills: Skill[];
  hiddenTalentFlag: boolean;
  evidence: Evidence[];
  experienceYears?: number;
}

export interface RadarPoint {
  axis: string;
  profileValue: number;
  requiredValue: number;
}

export interface FactorContribution {
  factor: string;
  percentage: number;
  impact: 'positive' | 'neutral' | 'negative';
}

export interface AdjacentSkillPath {
  fromSkill: string;
  bridge: string;
  toSkill: string;
}

export interface MatchResult {
  profileId: string;
  opportunityId: string;
  score: number;
  reasons: [string, string];
  radar: RadarPoint[];
  breakdown: FactorContribution[];
  evidence: Evidence[];
  hiddenTalent: boolean;
  adjacentPath?: AdjacentSkillPath;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  approvedAt?: string;
}

export interface Opportunity {
  id: string;
  title: string;
  client: string;
  sector: string;
  location: string;
  modality: 'Remoto' | 'Híbrido' | 'Presencial';
  deadline: string;
  urgency: Urgency;
  mustHaveSkills: string[];
  status: OpportunityStatus;
  bestMatchScore: number;
  openedAt: string;
  description: string;
  headcount: number;
}

export interface AuditLogEntry {
  id: string;
  actor: string;
  action: 'Aprobado' | 'Descartado' | 'Modo ciego activado' | 'Modo ciego desactivado';
  targetName: string;
  opportunityTitle: string;
  timestamp: string;
  note: string;
}

export interface SkillDemandSupply {
  skill: string;
  demand: number;
  supply: number;
  gap: number;
  isHighlighted?: boolean;
}

export interface HeatmapDatum {
  id: string;
  data: Array<{
    x: string;
    y: number;
  }>;
}

export interface SankeyData {
  nodes: Array<{ id: string; nodeColor?: string }>;
  links: Array<{ source: string; target: string; value: number }>;
}

export interface SkillAdjacencyNode {
  id: string;
  label: string;
  type: 'required' | 'bridge' | 'source';
  profilesCount: number;
  category: string;
}

export interface SkillAdjacencyEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

export interface CopilotMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  inlineOpportunityId?: string;
  inlineProfiles?: Array<{
    id: string;
    name: string;
    score: number;
    role: string;
  }>;
}

export interface AppState {
  mode: AppMode;
  blindMode: boolean;
  approvedMatches: Record<string, string[]>; // opportunityId -> profileId[]
  rejectedMatches: Record<string, { profileId: string; reason: string }[]>;
  auditLog: AuditLogEntry[];
}
