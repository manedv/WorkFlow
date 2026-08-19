import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Comment {
  id: string;
  content: string;
  issueId: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author: { id: string; name: string; email: string; avatar: string | null };
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class CommentService {
  constructor(private http: HttpClient) {}

  getByIssue(issueId: string): Observable<ApiResponse<Comment[]>> {
    return this.http.get<ApiResponse<Comment[]>>(`/api/issues/${issueId}/comments`);
  }

  create(issueId: string, content: string): Observable<ApiResponse<Comment>> {
    return this.http.post<ApiResponse<Comment>>(`/api/issues/${issueId}/comments`, { content });
  }

  update(commentId: string, content: string): Observable<ApiResponse<Comment>> {
    return this.http.patch<ApiResponse<Comment>>(`/api/comments/${commentId}`, { content });
  }

  delete(commentId: string): Observable<ApiResponse<{ message: string }>> {
    return this.http.delete<ApiResponse<{ message: string }>>(`/api/comments/${commentId}`);
  }
}
