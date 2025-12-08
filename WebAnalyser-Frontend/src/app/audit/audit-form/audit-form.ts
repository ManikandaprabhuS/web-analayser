import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuditService } from '../../service/audit';

@Component({
  selector: 'app-audit-form',
   imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './audit-form.html',
  styleUrl: './audit-form.css',
})
export class AuditForm {
  
auditForm: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private auditService: AuditService
  ) {
    this.auditForm = this.fb.group({
      url: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      type: ['', Validators.required]
    });
  }

  submitAudit() {
    if (this.auditForm.invalid) {
      this.auditForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    console.log(this.auditForm.value);
    this.auditService.sendAuditRequest(this.auditForm.value)
      .subscribe({
        next: (res: any) => {
          console.log(res);
          this.isSubmitting = false;
          // For now just show simple message; later we’ll display critical issues
          alert('Audit started! Check your email for full report.');
        },
        error: (err: any) => {
          console.error(err);
          this.isSubmitting = false;
          alert('Something went wrong. Please try again.');
        }
      });
  }
}