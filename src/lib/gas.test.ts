import { describe, it, expect } from 'vitest';
import { buildGasParams } from './gas';
import { usdm_ADDRESS } from './contract';

const fakeClient = { getGasPrice: async () => 1234n };

describe('buildGasParams', () => {
  it('always sets gasPrice', async () => {
    const p = await buildGasParams(fakeClient, false);
    expect(p.gasPrice).toBe(1234n);
  });

  it('omits feeCurrency for regular wallets', async () => {
    const p = await buildGasParams(fakeClient, false);
    expect(p.feeCurrency).toBeUndefined();
  });

  it('uses usdm feeCurrency for MiniPay', async () => {
    const p = await buildGasParams(fakeClient, true);
    expect(p.feeCurrency).toBe(usdm_ADDRESS);
  });
});
