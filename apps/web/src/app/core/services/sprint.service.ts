import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Issue } from './issue.service';

export interface Sprint {
  id: string;
  name: string;
  goal: string | null;
  projectId: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  issues?: Issue[];
  _count?: { issues: number };
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class SprintService {
  constructor(private http: HttpClient) {}

  getByProject(projectId: string): Observable<ApiResponse<Sprint[]>> {
    return this.http.get<ApiResponse<Sprint[]>>(`/api/projects/${projectId}/sprints`);
  }

  getBacklog(projectId: string): Observable<ApiResponse<Issue[]>> {
    return this.http.get<ApiResponse<Issue[]>>(`/api/projects/${projectId}/backlog`);
  }

  getById(id: string): Observable<ApiResponse<Sprint>> {
    return this.http.get<ApiResponse<Sprint>>(`/api/sprints/${id}`);
  }

  create(projectId: string, data: { name: string; goal?: string; startDate?: string; endDate?: string }): Observable<ApiResponse<Sprint>> {
    return this.http.post<ApiResponse<Sprint>>(`/api/projects/${projectId}/sprints`, data);
  }

  update(id: string, data: Partial<{ name: string; goal: string; status: string; startDate: string; endDate: string }>): Observable<ApiResponse<Sprint>> {
    return this.http.patch<ApiResponse<Sprint>>(`/api/sprints/${id}`, data);
  }

  start(id: string): Observable<ApiResponse<Sprint>> {
    return this.http.post<ApiResponse<Sprint>>(`/api/sprints/${id}/start`, {});
  }

  complete(id: string): Observable<ApiResponse<Sprint>> {
    return this.http.post<ApiResponse<Sprint>>(`/api/sprints/${id}/complete`, {});
  }

  delete(id: string): Observable<ApiResponse<{ message: string }>> {
    return this.http.delete<ApiResponse<{ message: string }>>(`/api/sprints/${id}`);
  }

  addIssue(sprintId: string, issueId: string): Observable<ApiResponse<Issue>> {
    return this.http.post<ApiResponse<Issue>>(`/api/sprints/${sprintId}/issues/${issueId}`, {});
  }

  removeIssue(sprintId: string, issueId: string): Observable<ApiResponse<Issue>> {
    return this.http.delete<ApiResponse<Issue>>(`/api/sprints/${sprintId}/issues/${issueId}`);
  }
}
