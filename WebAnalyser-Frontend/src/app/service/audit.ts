import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { AuditRequest } from '../models/audit.model';

@Injectable({
  providedIn: 'root',
})

export class AuditService {


  // TODO: change this to your real backend URL
  private API_URL = 'http://localhost:5000/api/audit';

  constructor(private http: HttpClient) {}

sendAuditRequest(data: AuditRequest): Observable<any> {
    return this.http.post(this.API_URL, data);
  }
  
}