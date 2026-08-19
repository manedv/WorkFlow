import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Status {
  id: string;
  name: string;
  slug: string;
  position: number;
  projectId: string;
}

export interface Issue {
  id: string;
  issueKey: string;
  issueNumber: number;
  projectId: string;
  type: string;
  summary: string;
  description: string | null;
  statusId: string;
  priority: string;
  reporterId: string;
  assigneeId: string | null;
  parentIssueId: string | null;
  storyPoints: number | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  status: Status;
  reporter: { id: string; name: string; email: string; avatar: string | null };
  assignee: { id: string; name: string; email: string; avatar: string | null } | null;
  parentIssue: { id: string; issueKey: string; summary: string } | null;
  subIssues: { id: string; issueKey: string; summary: string; type: string; priority: string; statusId: string }[];
  project?: { id: string; name: string; key: string };
}

export interface CreateIssuePayload {
  summary: string;
  description?: string;
  type?: string;
  priority?: string;
  assigneeId?: string;
  parentIssueId?: string;
  storyPoints?: number;
  dueDate?: string;
  statusId?: string;
}

export interface IssueFilters {
  assigneeId?: string;
  priority?: string;
  type?: string;
  statusId?: string;
}

export interface IssueCounts {
  total: number;
  byStatus: Record<string, number>;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class IssueService {
  constructor(private http: HttpClient) {}

  getByProject(projectId: string, filters?: IssueFilters): Observable<ApiResponse<Issue[]>> {
    let params = new HttpParams();
    if (filters?.assigneeId) params = params.set('assigneeId', filters.assigneeId);
    if (filters?.priority) params = params.set('priority', filters.priority);
    if (filters?.type) params = params.set('type', filters.type);
    if (filters?.statusId) params = params.set('statusId', filters.statusId);

    return this.http.get<ApiResponse<Issue[]>>(`/api/projects/${projectId}/issues`, { params });
  }

  getStatuses(projectId: string): Observable<ApiResponse<Status[]>> {
    return this.http.get<ApiResponse<Status[]>>(`/api/projects/${projectId}/statuses`);
  }

  getIssueCounts(projectId: string): Observable<ApiResponse<IssueCounts>> {
    return this.http.get<ApiResponse<IssueCounts>>(`/api/projects/${projectId}/issues/counts`);
  }

  getById(id: string): Observable<ApiResponse<Issue>> {
    return this.http.get<ApiResponse<Issue>>(`/api/issues/${id}`);
  }

  create(projectId: string, payload: CreateIssuePayload): Observable<ApiResponse<Issue>> {
    return this.http.post<ApiResponse<Issue>>(`/api/projects/${projectId}/issues`, payload);
  }

  update(id: string, payload: Partial<CreateIssuePayload>): Observable<ApiResponse<Issue>> {
    return this.http.patch<ApiResponse<Issue>>(`/api/issues/${id}`, payload);
  }

  updateStatus(id: string, statusId: string): Observable<ApiResponse<Issue>> {
    return this.http.patch<ApiResponse<Issue>>(`/api/issues/${id}/status`, { statusId });
  }

  updateAssignee(id: string, assigneeId: string | null): Observable<ApiResponse<Issue>> {
    return this.http.patch<ApiResponse<Issue>>(`/api/issues/${id}/assignee`, { assigneeId });
  }

  updatePriority(id: string, priority: string): Observable<ApiResponse<Issue>> {
    return this.http.patch<ApiResponse<Issue>>(`/api/issues/${id}/priority`, { priority });
  }

  delete(id: string): Observable<ApiResponse<{ message: string }>> {
    return this.http.delete<ApiResponse<{ message: string }>>(`/api/issues/${id}`);
  }
}
