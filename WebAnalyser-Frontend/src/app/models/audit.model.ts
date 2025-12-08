export interface AuditRequest {
  url: string;
  email: string;
  type: 'service' | 'ecommerce' | 'blog';
}
