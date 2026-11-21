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
  AppMode,
} from '../types';
import {
  STAFFING_OPPORTUNITIES,
  STAFFING_PROFILES,
  MATCH_RESULTS_BY_OPPORTUNITY,
  INITIAL_AUDIT_LOG,
  SKILL_DEMAND_SUPPLY,
  SKILL_GAP_HEATMAP,
  SANKEY_DATA,
  SKILL_ADJACENCY_NODES,
  SKILL_ADJACENCY_EDGES,
  BIAS_METRICS,
} from '../mock/data';
import {
  RECRUITMENT_OPPORTUNITIES,
  RECRUITMENT_PROFILES,
  RECRUITMENT_MATCH_RESULTS,
} from '../mock/recruitment';

/**
 * In-memory mutable state store (persisted in RAM per session)
 */
class MockStore {
  private staffingOpportunities = [...STAFFING_OPPORTUNITIES];
  private recruitmentOpportunities = [...RECRUITMENT_OPPORTUNITIES];

  private staffingProfiles = [...STAFFING_PROFILES];
  private recruitmentProfiles = [...RECRUITMENT_PROFILES];

  private matchResults: Record<string, MatchResult[]> = {
    ...MATCH_RESULTS_BY_OPPORTUNITY,
    ...RECRUITMENT_MATCH_RESULTS,
  };

  private auditLogs: AuditLogEntry[] = [...INITIAL_AUDIT_LOG];

  private checkDevState(): 'error' | 'empty' | 'loading' | null {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const state = params.get('state');
    if (state === 'error' || state === 'empty' || state === 'loading') {
      return state;
    }
    return null;
  }

  private async simulateLatency(): Promise<void> {
    const devState = this.checkDevState();
    if (devState === 'error') {
      await new Promise((r) => setTimeout(r, 400));
      throw new Error("Error simulado para pruebas de resiliencia (?state=error).");
    }
    if (devState === 'loading') {
      // Simulate indefinite loading
      await new Promise((r) => setTimeout(r, 60000));
    }
    const delay = Math.floor(Math.random() * (750 - 350 + 1)) + 350;
    return new Promise((resolve) => setTimeout(resolve, delay));
  }

  // --- Opportunities ---
  async getOpportunities(mode: AppMode = 'staffing'): Promise<Opportunity[]> {
    await this.simulateLatency();
    if (this.checkDevState() === 'empty') return [];
    return mode === 'staffing' ? [...this.staffingOpportunities] : [...this.recruitmentOpportunities];
  }

  async getOpportunityById(id: string, mode: AppMode = 'staffing'): Promise<Opportunity | null> {
    await this.simulateLatency();
    const list = mode === 'staffing' ? this.staffingOpportunities : this.recruitmentOpportunities;
    const opp = list.find((o) => o.id === id);
    return opp ? { ...opp } : null;
  }

  // --- Profiles ---
  async getProfiles(mode: AppMode = 'staffing'): Promise<Profile[]> {
    await this.simulateLatency();
    if (this.checkDevState() === 'empty') return [];
    return mode === 'staffing' ? [...this.staffingProfiles] : [...this.recruitmentProfiles];
  }

  async getProfileById(id: string, mode: AppMode = 'staffing'): Promise<Profile | null> {
    await this.simulateLatency();
    const list = mode === 'staffing' ? this.staffingProfiles : this.recruitmentProfiles;
    const p = list.find((item) => item.id === id);
    return p ? { ...p } : null;
  }

  // --- Matching Engine ---
  async getMatchesForOpportunity(opportunityId: string): Promise<MatchResult[]> {
    await this.simulateLatency();
    if (this.checkDevState() === 'empty') return [];
    const matches = this.matchResults[opportunityId] || [];
    return matches.map((m) => ({ ...m }));
  }

  async approveMatch(
    opportunityId: string,
    profileId: string,
    actor = "Alba Ruiz (Staffing Manager)"
  ): Promise<MatchResult> {
    await this.simulateLatency();
    const list = this.matchResults[opportunityId] || [];
    const match = list.find((m) => m.profileId === profileId);

    if (!match) {
      throw new Error("Coincidencia no encontrada.");
    }

    match.status = 'approved';
    match.approvedAt = new Date().toISOString();

    // Find names for audit log
    const profile = [...this.staffingProfiles, ...this.recruitmentProfiles].find(
      (p) => p.id === profileId
    );
    const opp = [...this.staffingOpportunities, ...this.recruitmentOpportunities].find(
      (o) => o.id === opportunityId
    );

    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      actor,
      action: 'Aprobado',
      targetName: profile ? profile.name : profileId,
      opportunityTitle: opp ? opp.title : opportunityId,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      note: `Aprobación manual confirmada con afinidad del ${match.score}%.`,
    };

    this.auditLogs = [newLog, ...this.auditLogs];
    return { ...match };
  }

  async rejectMatch(
    opportunityId: string,
    profileId: string,
    reason: string,
    actor = "Alba Ruiz (Staffing Manager)"
  ): Promise<MatchResult> {
    await this.simulateLatency();
    const list = this.matchResults[opportunityId] || [];
    const match = list.find((m) => m.profileId === profileId);

    if (!match) {
      throw new Error("Coincidencia no encontrada.");
    }

    match.status = 'rejected';
    match.rejectionReason = reason;

    const profile = [...this.staffingProfiles, ...this.recruitmentProfiles].find(
      (p) => p.id === profileId
    );
    const opp = [...this.staffingOpportunities, ...this.recruitmentOpportunities].find(
      (o) => o.id === opportunityId
    );

    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      actor,
      action: 'Descartado',
      targetName: profile ? profile.name : profileId,
      opportunityTitle: opp ? opp.title : opportunityId,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      note: `Descarte: ${reason}`,
    };

    this.auditLogs = [newLog, ...this.auditLogs];
    return { ...match };
  }

  // --- Aggregates & Analytics ---
  async getSkillDemandSupply(): Promise<SkillDemandSupply[]> {
    await this.simulateLatency();
    return [...SKILL_DEMAND_SUPPLY];
  }

  async getSkillGapHeatmap(): Promise<HeatmapDatum[]> {
    await this.simulateLatency();
    return [...SKILL_GAP_HEATMAP];
  }

  async getSankeyData(): Promise<SankeyData> {
    await this.simulateLatency();
    return { ...SANKEY_DATA };
  }

  async getSkillAdjacencyGraph(): Promise<{
    nodes: SkillAdjacencyNode[];
    edges: SkillAdjacencyEdge[];
  }> {
    await this.simulateLatency();
    return {
      nodes: [...SKILL_ADJACENCY_NODES],
      edges: [...SKILL_ADJACENCY_EDGES],
    };
  }

  async getBiasMetrics() {
    await this.simulateLatency();
    return [...BIAS_METRICS];
  }

  async getAuditLogs(): Promise<AuditLogEntry[]> {
    await this.simulateLatency();
    return [...this.auditLogs];
  }

  async logBlindModeChange(enabled: boolean): Promise<void> {
    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      actor: "Sistema / Sesión Actual",
      action: enabled ? 'Modo ciego activado' : 'Modo ciego desactivado',
      targetName: "Filtro Global",
      opportunityTitle: "Todas",
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      note: enabled
        ? "Anonimización de nombres e imágenes activada para mitigar sesgos inconscientes."
        : "Anonimización desactivada.",
    };
    this.auditLogs = [newLog, ...this.auditLogs];
  }
}

// Single instance of MockStore acting as the mock server
export const mockStore = new MockStore();

// Exported public API facade (all consumers must import from here)
export const api = {
  getOpportunities: (mode?: AppMode) => mockStore.getOpportunities(mode),
  getOpportunityById: (id: string, mode?: AppMode) => mockStore.getOpportunityById(id, mode),
  getProfiles: (mode?: AppMode) => mockStore.getProfiles(mode),
  getProfileById: (id: string, mode?: AppMode) => mockStore.getProfileById(id, mode),
  getMatchesForOpportunity: (id: string) => mockStore.getMatchesForOpportunity(id),
  approveMatch: (oppId: string, profId: string) => mockStore.approveMatch(oppId, profId),
  rejectMatch: (oppId: string, profId: string, reason: string) =>
    mockStore.rejectMatch(oppId, profId, reason),
  getSkillDemandSupply: () => mockStore.getSkillDemandSupply(),
  getSkillGapHeatmap: () => mockStore.getSkillGapHeatmap(),
  getSankeyData: () => mockStore.getSankeyData(),
  getSkillAdjacencyGraph: () => mockStore.getSkillAdjacencyGraph(),
  getBiasMetrics: () => mockStore.getBiasMetrics(),
  getAuditLogs: () => mockStore.getAuditLogs(),
  logBlindModeChange: (enabled: boolean) => mockStore.logBlindModeChange(enabled),
};
