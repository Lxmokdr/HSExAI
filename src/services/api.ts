// API service for Django backend integration

// Determine API URL based on environment
// Priority:
// 1. VITE_API_BASE_URL environment variable (set in Vercel/build)
// 2. Auto-detect production (if on Vercel domain, use Render backend)
// 3. Fallback to localhost for local development
function getApiBaseUrl(): string {
  // Check if VITE_API_BASE_URL is explicitly set (from build-time env var)
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl;
  }

  // Auto-detect production environment at runtime
  // If running on Vercel domain or any production domain, use Render backend
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;

    // Production detection: not localhost and not 127.0.0.1
    const isProduction = hostname !== 'localhost' &&
      hostname !== '127.0.0.1' &&
      !hostname.startsWith('192.168.') &&
      !hostname.startsWith('10.') &&
      (hostname.includes('vercel.app') ||
        hostname.includes('onrender.com') ||
        hostname.includes('.com') ||
        hostname.includes('.net') ||
        hostname.includes('.org'));

    if (isProduction) {
      return 'https://guardian-vision.onrender.com/api';
    }
  }

  // Fallback to localhost for local development
  return 'http://localhost:8000/api';
}

const API_BASE_URL = getApiBaseUrl();

// Always log the API URL being used (helps with debugging)
console.log('🔧 API Configuration:');
console.log('  - Base URL:', API_BASE_URL);
console.log('  - VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL || 'not set');
console.log('  - Hostname:', typeof window !== 'undefined' ? window.location.hostname : 'N/A');
console.log('  - Mode:', import.meta.env.MODE || 'unknown');
console.log('  - Dev:', import.meta.env.DEV ? 'true' : 'false');
console.log('  - Prod:', import.meta.env.PROD ? 'true' : 'false');

// Types
export interface User {
  id: number;
  username: string;
  role: 'service_maintenance' | 'service_integration' | 'chef_departement' | 'superadmin';
  created_at: string;
  is_active?: boolean;
  is_staff?: boolean;
  is_superuser?: boolean;
}

export interface Incident {
  id: number;
  incident_type: 'hardware' | 'software';
  date: string;
  time: string;
  description: string;
  // Hardware fields
  nom_de_equipement?: string;
  partition?: string;
  numero_de_serie?: string;
  equipement_id?: number;
  equipment?: {
    id: number;
    nom_equipement: string;
    partition: string;
    num_serie: string;
  } | null;
  anomalie_observee?: string;
  action_realisee?: string;
  piece_de_rechange_utilisee?: string;
  etat_de_equipement_apres_intervention?: string;
  recommendation?: string;
  duree_arret?: number;
  maintenance_type?: 'preventive' | 'corrective';
  // Software fields
  server?: string;
  position?: string;
  type_d_anomalie?: string;
  call_sign?: string;
  nom_radar?: string;
  FL?: string;
  longitude?: string;
  latitude?: string;
  code_SSR?: string;
  sujet?: string;
  commentaires?: string;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: number;
  incident: number;
  incident_type: 'hardware' | 'software';
  date: string;
  time: string;
  anomaly: string;
  analysis: string;
  conclusion: string;
  created_at: string;
  updated_at: string;
}

export interface Equipment {
  id: number;
  num_serie?: string;
  nom_equipement: string;
  partition: string;
  etat?: string;
  risk_level?: string;
  risk_score?: number;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refresh_token?: string;
  user: User;
  message: string;
}

export interface IncidentStats {
  total_incidents: number;
  hardware_incidents: number;
  software_incidents: number;
  hardware_downtime_minutes?: number;
  hardware_avg_downtime_minutes?: number | null;
  hardware_incidents_with_downtime?: number;
  hardware_downtime_percentage?: number;
  hardware_last_7_days?: number;
  hardware_last_30_days?: number;
  software_last_7_days?: number;
  software_last_30_days?: number;
  maintenance_preventive_count?: number;
  maintenance_corrective_count?: number;
}

export interface RiskPrediction {
  equipment_id: number;
  equipment_name?: string;
  equipment_serial?: string;
  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence: number;
}

// ============================================================================
// API Client
// ============================================================================

class ApiClient {
  private baseURL: string;
  private token: string | null = null;
  private refreshTokenValue: string | null = null;
  private refreshPromise: Promise<string> | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('auth_token');
    this.refreshTokenValue = localStorage.getItem('auth_refresh_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  setRefreshToken(refreshToken: string | null) {
    this.refreshTokenValue = refreshToken;
    if (refreshToken) {
      localStorage.setItem('auth_refresh_token', refreshToken);
    } else {
      localStorage.removeItem('auth_refresh_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Always refresh token from localStorage in case it was updated elsewhere
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      this.token = storedToken;
    }

    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Use stored token if available, even if this.token is null
    const tokenToUse = this.token || storedToken;
    if (tokenToUse) {
      headers['Authorization'] = `Bearer ${tokenToUse}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        // Handle 401 Unauthorized - try to refresh token
        if (response.status === 401 && this.refreshTokenValue && endpoint !== '/auth/refresh/') {
          try {
            const newToken = await this.refreshToken();
            // Retry the original request with new token
            headers['Authorization'] = `Bearer ${newToken}`;
            const retryResponse = await fetch(url, {
              ...options,
              headers,
            });
            if (retryResponse.ok) {
              return retryResponse.json();
            }
          } catch (refreshError) {
            // Refresh failed, clear tokens and throw original error
            this.setToken(null);
            this.setRefreshToken(null);
            localStorage.removeItem('auth_user');
          }
        }

        const errorData = await response.json().catch(() => ({}));

        // Log error details for debugging (always log 400 errors to help diagnose issues)
        if (import.meta.env.DEV || response.status === 400) {
          console.error('❌ API Error Details:', {
            status: response.status,
            url: url,
            endpoint: endpoint,
            errorData: errorData,
          });
          // Also log the full error data as JSON for easier reading
          if (response.status === 400) {
            console.error('📋 Full Error Response:', JSON.stringify(errorData, null, 2));
          }
        }

        // Handle different error formats
        let errorMessage = errorData.error || errorData.message || errorData.detail;

        // Handle non_field_errors (common in DRF)
        if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) {
          errorMessage = errorData.non_field_errors[0];
        }

        // Handle field-specific validation errors
        if (errorData.errors && typeof errorData.errors === 'object') {
          const errorMessages = Object.entries(errorData.errors)
            .map(([field, messages]: [string, any]) => {
              const msg = Array.isArray(messages) ? messages.join(', ') : String(messages);
              return `${field}: ${msg}`;
            })
            .join('; ');
          if (errorMessages) {
            errorMessage = errorMessage ? `${errorMessage} (${errorMessages})` : errorMessages;
          }
        }

        // Handle DRF serializer errors (nested structure)
        if (errorData.username && Array.isArray(errorData.username)) {
          errorMessage = `Nom d'utilisateur: ${errorData.username.join(', ')}`;
        }
        if (errorData.password && Array.isArray(errorData.password)) {
          const pwdMsg = errorData.password.join(', ');
          errorMessage = errorMessage ? `${errorMessage}; Mot de passe: ${pwdMsg}` : `Mot de passe: ${pwdMsg}`;
        }

        if (!errorMessage) {
          errorMessage = `HTTP error! status: ${response.status}`;
        }
        const error = new Error(errorMessage);
        (error as any).status = response.status;
        (error as any).data = errorData;
        (error as any).locked = errorData.locked || false;
        (error as any).locked_until = errorData.locked_until;
        throw error;
      }

      return response.json();
    } catch (error: any) {
      // Handle network errors (Failed to fetch, CORS, etc.)
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        const baseUrl = this.baseURL.replace('/api', '');
        let errorMessage = `Impossible de se connecter au serveur.`;

        // Provide helpful message based on environment
        if (baseUrl.includes('localhost')) {
          errorMessage += ` Vérifiez que le backend est démarré sur ${baseUrl}`;
        } else {
          errorMessage += ` Tentative de connexion à ${baseUrl}/api`;
          errorMessage += `\nVérifiez que le backend Render est en ligne et que CORS est configuré.`;
        }

        const networkError = new Error(errorMessage);
        (networkError as any).status = 0;
        (networkError as any).isNetworkError = true;
        (networkError as any).url = this.baseURL;
        throw networkError;
      }
      // Re-throw other errors
      throw error;
    }
  }

  // ========================================================================
  // Authentication Methods
  // ========================================================================

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    // Ensure credentials are properly formatted
    const loginData = {
      username: credentials.username?.trim() || '',
      password: credentials.password || '',
    };

    // Debug log (always log for login to help diagnose issues)
    console.log('🔐 Login request:', {
      username: loginData.username,
      passwordLength: loginData.password.length,
      hasUsername: !!loginData.username,
      hasPassword: !!loginData.password,
    });

    const response = await this.request<LoginResponse>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify(loginData),
    });

    this.token = response.token;
    this.setToken(response.token);
    if (response.refresh_token) {
      this.setRefreshToken(response.refresh_token);
    }
    localStorage.setItem('auth_token', response.token);
    localStorage.setItem('auth_user', JSON.stringify(response.user));

    return response;
  }

  async refreshToken(): Promise<string> {
    // Prevent multiple simultaneous refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    if (!this.refreshTokenValue) {
      const storedRefresh = localStorage.getItem('auth_refresh_token');
      if (!storedRefresh) {
        throw new Error('No refresh token available');
      }
      this.refreshTokenValue = storedRefresh;
    }

    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${this.baseURL}/auth/refresh/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh_token: this.refreshTokenValue }),
        });

        if (!response.ok) {
          throw new Error('Token refresh failed');
        }

        const data = await response.json();
        this.token = data.token;
        this.setToken(data.token);
        if (data.refresh_token) {
          this.setRefreshToken(data.refresh_token);
        }
        return data.token;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem('auth_refresh_token');
      await this.request('/auth/logout/', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    } finally {
      this.token = null;
      this.setToken(null);
      this.setRefreshToken(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_refresh_token');
      localStorage.removeItem('auth_user');
    }
  }

  async getProfile(): Promise<User> {
    return this.request<User>('/auth/profile/');
  }

  async updateProfile(userData: Partial<User>): Promise<User> {
    return this.request<User>('/auth/profile/update/', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await this.request('/auth/change-password/', {
      method: 'POST',
      body: JSON.stringify({
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: newPassword,
      }),
    });
  }

  // ========================================================================
  // Incident Methods
  // ========================================================================

  async getIncidents(params?: {
    type?: 'hardware' | 'software';
  }): Promise<{ results: Incident[]; count: number }> {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.set('type', params.type);

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/incidents/?${queryString}` : '/incidents/';

    return this.request<{ results: Incident[]; count: number }>(endpoint);
  }

  async getIncident(id: number): Promise<Incident> {
    return this.request<Incident>(`/incidents/${id}/`);
  }

  async createIncident(incidentData: Omit<Incident, 'id' | 'created_at' | 'updated_at'>): Promise<Incident> {
    return this.request<Incident>('/incidents/', {
      method: 'POST',
      body: JSON.stringify(incidentData),
    });
  }

  async updateIncident(id: number, incidentData: Partial<Incident>): Promise<Incident> {
    const incidentType = incidentData.incident_type;
    const endpoint = incidentType === 'hardware'
      ? `/incidents/hardware/${id}/`
      : `/incidents/software/${id}/`;

    return this.request<Incident>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(incidentData),
    });
  }

  async deleteIncident(id: number): Promise<void> {
    await this.request(`/incidents/${id}/`, {
      method: 'DELETE',
    });
  }

  async getIncidentStats(): Promise<IncidentStats> {
    return this.request<IncidentStats>('/incidents/stats/');
  }

  async getRecentIncidents(): Promise<Incident[]> {
    return this.request<Incident[]>('/incidents/recent/');
  }

  // ========================================================================
  // Report Methods
  // ========================================================================

  async getReports(params?: { incident?: number }): Promise<{ results: Report[]; count: number }> {
    const searchParams = new URLSearchParams();
    if (params?.incident) searchParams.set('incident', params.incident.toString());

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/reports/?${queryString}` : '/reports/';

    return this.request<{ results: Report[]; count: number }>(endpoint);
  }

  async getReport(id: number): Promise<Report> {
    return this.request<Report>(`/reports/${id}/`);
  }

  async createReport(reportData: Omit<Report, 'id' | 'created_at' | 'updated_at'>): Promise<Report> {
    return this.request<Report>('/reports/', {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  }

  async updateReport(id: number, reportData: Partial<Report>): Promise<Report> {
    return this.request<Report>(`/reports/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(reportData),
    });
  }

  async deleteReport(id: number): Promise<void> {
    await this.request(`/reports/${id}/`, {
      method: 'DELETE',
    });
  }

  // ========================================================================
  // Equipment Methods
  // ========================================================================

  async getEquipment(params?: { num_serie?: string; search_serie?: string }): Promise<{ results: Equipment[]; count: number } | Equipment | { results: string[]; count: number }> {
    const searchParams = new URLSearchParams();
    if (params?.num_serie) searchParams.set('num_serie', params.num_serie);
    if (params?.search_serie) searchParams.set('search_serie', params.search_serie);

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/equipement/?${queryString}` : '/equipement/';

    return this.request<{ results: Equipment[]; count: number } | Equipment | { results: string[]; count: number }>(endpoint);
  }

  async getEquipmentItem(id: number): Promise<Equipment> {
    return this.request<Equipment>(`/equipement/${id}/`);
  }

  async createEquipment(equipmentData: Omit<Equipment, 'id' | 'created_at' | 'updated_at'>): Promise<Equipment> {
    return this.request<Equipment>('/equipement/', {
      method: 'POST',
      body: JSON.stringify(equipmentData),
    });
  }

  async updateEquipment(id: number, equipmentData: Partial<Equipment>): Promise<Equipment> {
    return this.request<Equipment>(`/equipement/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(equipmentData),
    });
  }

  async deleteEquipment(id: number): Promise<void> {
    await this.request(`/equipement/${id}/`, {
      method: 'DELETE',
    });
  }

  async getEquipmentHistory(id: number): Promise<{ equipment: Equipment; incidents: Incident[]; count: number }> {
    return this.request<{ equipment: Equipment; incidents: Incident[]; count: number }>(`/equipement/${id}/history/`);
  }

  // ========================================================================
  // User Management Methods (superadmin only)
  // ========================================================================

  async getUsers(): Promise<{ results: User[]; count: number }> {
    return this.request<{ results: User[]; count: number }>('/users/');
  }

  async getUser(id: number): Promise<User> {
    return this.request<User>(`/users/${id}/`);
  }

  async createUser(userData: Omit<User, 'id' | 'created_at'> & { password: string }): Promise<User> {
    return this.request<User>('/users/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id: number, userData: Partial<User> & { password?: string }): Promise<User> {
    return this.request<User>(`/users/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id: number): Promise<void> {
    await this.request(`/users/${id}/`, {
      method: 'DELETE',
    });
  }

  // ========================================================================
  // Risk Prediction Methods (HSE Module)
  // ========================================================================

  async getTopRisks(limit: number = 5): Promise<{ count: number; results: RiskPrediction[] }> {
    return this.request<{ count: number; results: RiskPrediction[] }>(`/equipement/top-risks/?n=${limit}`);
  }

  async getEquipmentRisk(id: number): Promise<RiskPrediction> {
    return this.request<RiskPrediction>(`/equipement/${id}/risk/`);
  }

  async trainRiskModel(): Promise<any> {
    return this.request<any>('/risk/train/', {
      method: 'POST',
    });
  }

  // ========================================================================
  // AI Safety Engine Methods — Phase 1
  // ========================================================================

  /**
   * Upload an image and run YOLOv8 PPE detection.
   * Uses FormData (multipart/form-data) — NOT JSON.
   */
  async detectImage(
    formData: FormData
  ): Promise<DetectionEvent> {
    const url = `${this.baseURL}/ai/detect/image/`;
    const storedToken = localStorage.getItem('auth_token');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${storedToken}`,
        // Do NOT set Content-Type — browser sets multipart boundary automatically
      },
      body: formData,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || err.detail || `Detection failed (${response.status})`);
    }
    return response.json();
  }

  async getDetectionEvents(params?: {
    zone?: number;
    limit?: number;
    offset?: number;
  }): Promise<{ count: number; results: DetectionEventSummary[] }> {
    const sp = new URLSearchParams();
    if (params?.zone) sp.set('zone', String(params.zone));
    if (params?.limit) sp.set('limit', String(params.limit));
    if (params?.offset) sp.set('offset', String(params.offset));
    const qs = sp.toString();
    return this.request<{ count: number; results: DetectionEventSummary[] }>(
      qs ? `/ai/events/?${qs}` : '/ai/events/'
    );
  }

  async getDetectionEvent(id: number): Promise<DetectionEvent> {
    return this.request<DetectionEvent>(`/ai/events/${id}/`);
  }

  async getViolations(params?: {
    risk_level?: string;
    type?: string;
    zone?: number;
    limit?: number;
    offset?: number;
  }): Promise<{ count: number; results: SafetyViolation[] }> {
    const sp = new URLSearchParams();
    if (params?.risk_level) sp.set('risk_level', params.risk_level);
    if (params?.type) sp.set('type', params.type);
    if (params?.zone) sp.set('zone', String(params.zone));
    if (params?.limit) sp.set('limit', String(params.limit));
    if (params?.offset) sp.set('offset', String(params.offset));
    const qs = sp.toString();
    return this.request<{ count: number; results: SafetyViolation[] }>(
      qs ? `/ai/violations/?${qs}` : '/ai/violations/'
    );
  }

  async getRecentViolations(): Promise<SafetyViolation[]> {
    return this.request<SafetyViolation[]>('/ai/violations/recent/');
  }

  async getComplianceStats(days = 30): Promise<ComplianceStats> {
    return this.request<ComplianceStats>(`/ai/statistics/compliance/?days=${days}`);
  }

  async getZones(): Promise<{ count: number; results: Zone[] }> {
    return this.request<{ count: number; results: Zone[] }>('/ai/zones/');
  }

  async createZone(data: Omit<Zone, 'id' | 'created_at' | 'updated_at' | 'violation_count'>): Promise<Zone> {
    return this.request<Zone>('/ai/zones/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateZone(id: number, data: Partial<Zone>): Promise<Zone> {
    return this.request<Zone>(`/ai/zones/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteZone(id: number): Promise<void> {
    await this.request(`/ai/zones/${id}/`, { method: 'DELETE' });
  }

  // Phase 2 Analytics
  async getComplianceAnalytics(): Promise<any> {
    return this.request('/ai/analytics/compliance/');
  }

  async getZoneRiskAnalytics(): Promise<any> {
    return this.request('/ai/analytics/zones/');
  }

  async getSafetyInsights(): Promise<any[]> {
    return this.request<any[]>('/ai/insights/');
  }

  // Phase 3 Executive Analytics
  async getExecutiveSummary(): Promise<any> {
    return this.request('/ai/analytics/summary/');
  }

  async getPPEDistribution(): Promise<any[]> {
    return this.request('/ai/analytics/ppe/');
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

// ============================================================================
// AI Engine Type Definitions
// ============================================================================

export interface Zone {
  id: number;
  name: string;
  description: string;
  risk_category: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  is_active: boolean;
  violation_count: number;
  required_ppe_rules: string[];
  compliance_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface SafetyViolation {
  id: number;
  event_id: number;
  violation_type: 'no_helmet' | 'no_vest' | 'no_mask' | 'no_gloves' | 'unauthorized_person' | 'other';
  violation_type_display: string;
  confidence_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_level_display: string;
  bounding_box: { x1: number; y1: number; x2: number; y2: number };
  zone: number | null;
  zone_name: string | null;
  notes: string;
  timestamp: string;
  severity: string;
  required_ppe: string[];
  detected_ppe: string[];
  ai_summary: string;
  zone_risk: string;
}

export interface DetectedObject {
  class_id: number;
  class_name: string;
  confidence: number;
  bounding_box: { x1: number; y1: number; x2: number; y2: number };
}

export interface DetectionResults {
  detected_objects: DetectedObject[];
  violation_classes: string[];
  compliant_classes: string[];
  image_size: [number, number];
}

export interface DetectionEvent {
  id: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  zone: number | null;
  zone_name: string | null;
  original_image_url: string | null;
  annotated_image_url: string | null;
  detection_results: DetectionResults;
  violations: SafetyViolation[];
  compliance_rate: number;
  processing_time_ms: number;
  error_message: string;
  risk_score: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  compliance_status: boolean;
  ai_summary: string;
  created_by_username: string | null;
  created_at: string;
}

export interface DetectionEventSummary {
  id: number;
  status: string;
  zone: number | null;
  zone_name: string | null;
  original_image_url: string | null;
  annotated_image_url: string | null;
  violation_count: number;
  processing_time_ms: number;
  created_by_username: string | null;
  created_at: string;
}

export interface ComplianceStats {
  total_events: number;
  total_violations: number;
  compliance_rate: number;
  violations_by_type: Record<string, number>;
  violations_by_risk: Record<string, number>;
  violations_by_day: Array<{ date: string; count: number }>;
  top_zones: Array<{ zone: string; count: number }>;
}

