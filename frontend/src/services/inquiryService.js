import { api, portal } from './api.js';

/**
 * Public contact / briefing form. The `website` field is the honeypot and must
 * stay empty for humans.
 */
export function createInquiry(payload) {
  return api
    .post(
      '/inquiries',
      {
        name: payload.name,
        email: payload.email,
        phone: payload.phone || '',
        message: payload.message,
        type: payload.type || 'contact',
        serviceInterest: payload.serviceInterest || '',
        website: payload.website || '',
      },
      portal('public'),
    )
    .then((res) => res.data);
}
