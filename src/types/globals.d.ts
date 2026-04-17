export {};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
    _linkedin_partner_id?: string;
    _linkedin_data_partner_ids?: string[];
  }
}
