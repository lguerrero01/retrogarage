import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiBaseUrl;

  constructor(private http: HttpClient, private auth: AuthService) {}

  private async headers(): Promise<HttpHeaders> {
    const token = await this.auth.getIdToken();
    return token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();
  }

  async get<T>(path: string): Promise<T> {
    const headers = await this.headers();
    return firstValueFrom(this.http.get<T>(`${this.base}${path}`, { headers }));
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const headers = await this.headers();
    return firstValueFrom(this.http.post<T>(`${this.base}${path}`, body, { headers }));
  }

  async put<T>(path: string, body: unknown): Promise<T> {
    const headers = await this.headers();
    return firstValueFrom(this.http.put<T>(`${this.base}${path}`, body, { headers }));
  }

  async delete<T>(path: string): Promise<T> {
    const headers = await this.headers();
    return firstValueFrom(this.http.delete<T>(`${this.base}${path}`, { headers }));
  }
}
