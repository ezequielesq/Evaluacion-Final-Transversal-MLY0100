import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private baseUrl = 'https://www.ezsuarez.org/api';

  constructor(private http: HttpClient) {}

  // GET /health
  healthCheck(): Observable<any> {
    return this.http.get(`${this.baseUrl}/health`);
  }

  // POST /predict
  predict(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/predict`, data);
  }
}
