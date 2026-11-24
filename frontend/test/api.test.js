import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { STATUSI, klic, oblikujUro } from '../src/api.js';

const shramba = new Map();
globalThis.localStorage = { getItem: (k) => shramba.get(k) ?? null };

let zadnjiKlic;
function nastaviFetch(ok, telo) {
  globalThis.fetch = async (url, moznosti) => {
    zadnjiKlic = { url, moznosti };
    return { ok, json: async () => telo };
  };
}

describe('api.js', () => {
  beforeEach(() => shramba.clear());

  it('klic vrne podatke ob uspešnem odgovoru', async () => {
    nastaviFetch(true, [{ naziv: 'Akcija' }]);
    assert.deepEqual(await klic('/akcije'), [{ naziv: 'Akcija' }]);
  });

  it('klic pošlje žeton prijavljenega uporabnika', async () => {
    shramba.set('zeton', 'abc');
    nastaviFetch(true, {});
    await klic('/prijave/moje');
    assert.equal(zadnjiKlic.moznosti.headers.Authorization, 'Bearer abc');
  });

  it('klic ob napaki vrže sporočilo strežnika', async () => {
    nastaviFetch(false, { napaka: 'Napačen e-naslov ali geslo' });
    await assert.rejects(() => klic('/vpis', 'POST', {}), { message: 'Napačen e-naslov ali geslo' });
  });

  it('oblikujUro vrne uro in minute', () => {
    assert.match(oblikujUro('2030-05-10T09:05:00'), /09[:.]05/);
  });

  it('vsi statusi imajo oznako', () => {
    for (const s of ['ODDANA', 'POTRJENA', 'KONFLIKT', 'CAKALNA_VRSTA', 'ZAVRNJENA', 'PREKLICANA', 'UDELEZEN']) {
      assert.ok(STATUSI[s]);
    }
  });
});
