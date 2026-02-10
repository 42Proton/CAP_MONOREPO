import { verifyWebhookSignature } from './webhook';
import { createHmac } from 'node:crypto';

describe('verifyWebhookSignature', () => {
  const secret = 'my-webhook-secret';
  const payload = '{"action":"opened"}';

  function makeSignature(body: string, key: string): string {
    return `sha256=${createHmac('sha256', key).update(body).digest('hex')}`;
  }

  it('should return true for a valid signature', () => {
    const signature = makeSignature(payload, secret);
    expect(verifyWebhookSignature(payload, signature, secret)).toBe(true);
  });

  it('should return false for an invalid signature', () => {
    expect(verifyWebhookSignature(payload, 'sha256=invalid', secret)).toBe(false);
  });

  it('should return false when signature length differs', () => {
    expect(verifyWebhookSignature(payload, 'sha256=short', secret)).toBe(false);
  });

  it('should return false for a different secret', () => {
    const signature = makeSignature(payload, 'wrong-secret');
    expect(verifyWebhookSignature(payload, signature, secret)).toBe(false);
  });

  it('should return false for a different payload', () => {
    const signature = makeSignature('other-payload', secret);
    expect(verifyWebhookSignature(payload, signature, secret)).toBe(false);
  });
});
