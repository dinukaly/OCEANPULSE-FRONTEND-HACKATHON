const events = new Set([
  'session.read',
  'session.clear',
  'auth.forgot',
  'auth.verify',
  'auth.resend',
  'session.logout',
  'post.create',
  'post.like',
  'post.comment',
]);
const codes = new Set([
  'UNAUTHORIZED',
  'FORBIDDEN',
  'VALIDATION_ERROR',
  'CONFLICT',
  'NOT_FOUND',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
  'SERVICE_UNAVAILABLE',
  'UPSTREAM_ERROR',
  'UPSTREAM_TIMEOUT',
  'PROVIDER_RATE_LIMITED',
  'SOS_RECEIPT_UNCONFIRMED',
  'PROFILE_CONFLICT',
  'IMAGE_UPLOAD_UNAVAILABLE',
  'ORIGIN_NOT_ALLOWED',
  'ECONNABORTED',
  'ERR_NETWORK',
  'ERR_CANCELED',
]);

// Raw Axios/secure-storage errors may include credentials and request bodies.
export function logFailure(event: string, failure: any) {
  const entry: {
    event: string;
    code: string;
    status?: number;
    requestId?: string;
  } = {
    event: events.has(event) ? event : 'request.failed',
    code: 'REQUEST_FAILED',
  };
  const code = failure?.response?.data?.code || failure?.code;
  if (codes.has(code)) entry.code = code;
  const status = failure?.response?.status;
  if (Number.isInteger(status) && status >= 400 && status <= 599)
    entry.status = status;
  const requestId = failure?.response?.headers?.['x-request-id'];
  if (
    typeof requestId === 'string' &&
    /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(requestId)
  )
    entry.requestId = requestId;
  try {
    console.error(JSON.stringify(entry));
  } catch {
    /* Diagnostics must not change request behavior. */
  }
}
