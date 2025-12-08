import { Routes } from '@angular/router';
import { AuditForm } from './audit/audit-form/audit-form';

export const routes: Routes = [
  { path: '', component: AuditForm },
  { path: '**', redirectTo: '' }
];
