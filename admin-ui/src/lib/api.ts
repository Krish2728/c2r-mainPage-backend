const API = `${window.location.origin}/api`;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function getToken() {
  return localStorage.getItem("c2r_admin_token");
}

export function authHeaders(extra: Record<string, string> = {}) {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function parseJson<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { message?: string };
  if (!res.ok) {
    throw new ApiError((data as { message?: string }).message || "Request failed", res.status);
  }
  return data;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, init);
  return parseJson<T>(res);
}

export const api = {
  login(email: string, password: string) {
    return request<{ token: string; admin?: { name?: string } }>("/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  },

  stats() {
    return request<{
      totalEmails?: number;
      totalDonationsCount?: number;
      totalDonationsAmount?: number;
    }>("/admin/stats", { headers: authHeaders() });
  },

  emails(type: string) {
    return request<{ emails: EmailRecord[] }>(
      `/admin/emails?limit=200&type=${encodeURIComponent(type)}`,
      { headers: authHeaders() },
    );
  },

  volunteers() {
    return request<{ volunteers: VolunteerRecord[] }>("/admin/volunteers?limit=200", {
      headers: authHeaders(),
    });
  },

  exportEmails() {
    return fetch(`${API}/admin/emails/export`, { headers: authHeaders() });
  },

  donations() {
    return request<{ donations: DonationRecord[] }>(
      "/admin/donations?status=completed&limit=200",
      { headers: authHeaders() },
    );
  },

  resourceVideos() {
    return request<ResourceVideo[]>("/admin/resource-videos", { headers: authHeaders() });
  },

  saveResourceVideo(id: number | null, body: Record<string, unknown>) {
    return request<ResourceVideo>(id ? `/admin/resource-videos/${id}` : "/admin/resource-videos", {
      method: id ? "PUT" : "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
  },

  deleteResourceVideo(id: number) {
    return request<{ message?: string }>(`/admin/resource-videos/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
  },

  careerGuides() {
    return request<CareerGuide[]>("/admin/career-guides", { headers: authHeaders() });
  },

  saveCareerGuide(id: number | null, body: Record<string, unknown>) {
    return request<CareerGuide>(id ? `/admin/career-guides/${id}` : "/admin/career-guides", {
      method: id ? "PUT" : "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
  },

  deleteCareerGuide(id: number) {
    return request<{ message?: string }>(`/admin/career-guides/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
  },

  annualReports() {
    return request<AnnualReport[]>("/admin/annual-reports", { headers: authHeaders() });
  },

  saveAnnualReport(id: number | null, body: Record<string, unknown>) {
    return request<AnnualReport>(id ? `/admin/annual-reports/${id}` : "/admin/annual-reports", {
      method: id ? "PUT" : "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
  },

  deleteAnnualReport(id: number) {
    return request<{ message?: string }>(`/admin/annual-reports/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
  },

  mentorResources() {
    return request<MentorResource[]>("/admin/mentor-resources", { headers: authHeaders() });
  },

  saveMentorResource(id: number | null, body: Record<string, unknown>) {
    return request<MentorResource>(
      id ? `/admin/mentor-resources/${id}` : "/admin/mentor-resources",
      {
        method: id ? "PUT" : "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      },
    );
  },

  deleteMentorResource(id: number) {
    return request<{ message?: string }>(`/admin/mentor-resources/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
  },

  campaigns() {
    return request<CampaignSummary[]>("/admin/campaigns", { headers: authHeaders() });
  },

  campaign(id: number) {
    return request<CampaignDetail>(`/admin/campaigns/${id}`, { headers: authHeaders() });
  },

  saveCampaign(id: number | null, body: Record<string, unknown>) {
    return request<CampaignDetail>(id ? `/admin/campaigns/${id}` : "/admin/campaigns", {
      method: id ? "PUT" : "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
  },

  publishCampaign(id: number) {
    return request<CampaignDetail>(`/admin/campaigns/${id}/publish`, {
      method: "POST",
      headers: authHeaders(),
    });
  },

  deleteCampaign(id: number) {
    return request<{ message?: string }>(`/admin/campaigns/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
  },

  addCampaignProof(campaignId: number, body: Record<string, unknown>) {
    return request(`/admin/campaigns/${campaignId}/proofs`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
  },

  deleteCampaignProof(proofId: number) {
    return request(`/admin/campaigns/proofs/${proofId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
  },

  courseSignups() {
    return request<CourseSignup[]>("/admin/course-signups", { headers: authHeaders() });
  },

  teamMembers() {
    return request<TeamMember[]>("/admin/team/members", { headers: authHeaders() });
  },

  teamCategories() {
    return request<TeamCategory[]>("/admin/team/categories", { headers: authHeaders() });
  },

  saveTeamMember(id: number | null, body: Record<string, unknown>) {
    return request<TeamMember>(id ? `/admin/team/members/${id}` : "/admin/team/members", {
      method: id ? "PUT" : "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
  },

  deleteTeamMember(id: number) {
    return request<{ message?: string }>(`/admin/team/members/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
  },

  moveTeamMember(id: number, direction: "up" | "down") {
    return request<TeamMember>(`/admin/team/members/${id}/move`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ direction }),
    });
  },

  saveTeamCategory(id: number | null, body: Record<string, unknown>) {
    return request<TeamCategory>(
      id ? `/admin/team/categories/${id}` : "/admin/team/categories",
      {
        method: id ? "PUT" : "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      },
    );
  },

  deleteTeamCategory(id: number) {
    return request<{ message?: string }>(`/admin/team/categories/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
  },

  moveTeamCategory(id: number, direction: "up" | "down") {
    return request<TeamCategory>(`/admin/team/categories/${id}/move`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ direction }),
    });
  },
};

export type EmailRecord = {
  id?: number;
  type?: string;
  name?: string;
  email?: string;
  message?: string;
  company_name?: string;
  contact_person?: string;
  profession?: string;
  experience?: string;
  motivation?: string;
  created_at?: string;
};

export type VolunteerRecord = {
  created_at?: string;
  full_name?: string;
  email?: string;
  gender?: string;
  mobile_no?: string;
  date_of_birth?: string;
  current_address?: string;
  native_city_village?: string;
  languages?: string;
  current_company_org?: string;
  designation?: string;
  linkedin_profile?: string;
  years_of_experience?: string;
  has_volunteered_before?: string;
  highest_qualification?: string;
  how_can_you_contribute?: string;
  preferred_areas_mentoring?: string;
  hours_per_week?: string;
  preferred_days?: string;
  preferred_timings?: string;
  identity_number?: string;
};

export type DonationRecord = {
  created_at?: string;
  completed_at?: string;
  donor_name?: string;
  donor_email?: string;
  amount_display?: number;
  status?: string;
};

export type ResourceVideo = {
  id: number;
  title: string;
  description?: string;
  topic?: string;
  video_id: string;
  sort_order?: number;
};

export type CareerGuide = {
  id: number;
  title: string;
  description?: string;
  category?: string;
  pdf_url: string;
  sort_order?: number;
};

export type AnnualReport = {
  id: number;
  year: string;
  title: string;
  description?: string;
  pdf_url: string;
  sort_order?: number;
};

export type MentorResource = {
  id: number;
  title: string;
  description?: string;
  pdf_url: string;
  sort_order?: number;
};

export type CampaignSummary = {
  id: number;
  title: string;
  short_description?: string;
  status?: string;
  is_urgent?: boolean;
  category?: string;
  raised_amount?: number;
  goal_amount?: number;
};

export type CampaignProof = {
  id: number;
  title: string;
  media_url?: string;
};

export type CampaignDetail = CampaignSummary & {
  slug?: string;
  full_story?: string;
  cover_image_url?: string;
  location?: string;
  beneficiary_label?: string;
  goal_amount?: number;
  preset_amounts?: { amount: number; label?: string }[];
  is_featured?: boolean;
  proofs?: CampaignProof[];
};

export type CourseSignup = {
  created_at?: string;
  name?: string;
  email?: string;
  age?: number | null;
  mobile_number?: string;
};

export type TeamMember = {
  id: number;
  name: string;
  role: string;
  bio: string;
  linkedinUrl?: string;
  photoUrl?: string;
  photoClass?: string;
  panelType: "core" | "advisory";
  categoryId?: number | null;
  categoryTitle?: string | null;
  sortOrder?: number;
  status?: "published" | "draft";
};

export type TeamCategory = {
  id: number;
  title: string;
  sortOrder?: number;
  isAdditional?: boolean;
};

export const CAMPAIGN_SECTIONS = [
  { value: "scholarship", label: "Scholarship" },
  { value: "youth", label: "Youth & Students" },
  { value: "mentorship", label: "Mentorship" },
  { value: "skills", label: "Skills Training" },
  { value: "livelihood", label: "Livelihood" },
  { value: "health", label: "Health" },
  { value: "education", label: "Education" },
] as const;

export function campaignSectionLabel(id?: string) {
  return CAMPAIGN_SECTIONS.find((s) => s.value === id)?.label || "Education";
}
