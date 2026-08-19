import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
}

export interface Project {
  id: string;
  name: string;
  key: string;
  description: string | null;
  organizationId: string;
  leadId: string | null;
  avatar: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  lead: { id: string; name: string; email: string; avatar: string | null } | null;
  members: ProjectMember[];
  organization?: { id: string; name: string };
  currentUserRole?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly API_URL = '/api/projects';

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<Project[]>> {
    return this.http.get<ApiResponse<Project[]>>(this.API_URL);
  }

  getById(id: string): Observable<ApiResponse<Project>> {
    return this.http.get<ApiResponse<Project>>(`${this.API_URL}/${id}`);
  }

  create(data: {
    name: string;
    key: string;
    description?: string;
    organizationId: string;
    leadId?: string;
  }): Observable<ApiResponse<Project>> {
    return this.http.post<ApiResponse<Project>>(this.API_URL, data);
  }

  update(
    id: string,
    data: Partial<{
      name: string;
      key: string;
      description: string;
      leadId: string;
      isArchived: boolean;
    }>,
  ): Observable<ApiResponse<Project>> {
    return this.http.patch<ApiResponse<Project>>(`${this.API_URL}/${id}`, data);
  }

  archive(id: string): Observable<ApiResponse<{ message: string }>> {
    return this.http.delete<ApiResponse<{ message: string }>>(`${this.API_URL}/${id}`);
  }

  getMembers(projectId: string): Observable<ApiResponse<ProjectMember[]>> {
    return this.http.get<ApiResponse<ProjectMember[]>>(`${this.API_URL}/${projectId}/members`);
  }

  addMember(
    projectId: string,
    userId: string,
    role: string = 'MEMBER',
  ): Observable<ApiResponse<Project>> {
    return this.http.post<ApiResponse<Project>>(`${this.API_URL}/${projectId}/members`, {
      userId,
      role,
    });
  }

  removeMember(projectId: string, userId: string): Observable<ApiResponse<Project>> {
    return this.http.delete<ApiResponse<Project>>(
      `${this.API_URL}/${projectId}/members/${userId}`,
    );
  }
}
