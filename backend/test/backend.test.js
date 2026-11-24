const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Akcija = require('../models/Akcija');
const Prijava = require('../models/Prijava');
const { preveriZeton, zahtevajVlogo } = require('../middleware/avtentikacija');

const ob = (ura) => new Date(`2030-05-10T${ura}:00`);
const akcija = (od, doUre) =>
  new Akcija({
    organizacijaId: new mongoose.Types.ObjectId(),
    naziv: 'Akcija',
    opis: 'Opis',
    lokacija: 'Maribor',
    zacetek: ob(od),
    konec: ob(doUre),
    steviloMest: 2
  });

function odgovor() {
  return {
    koda: 200,
    status(koda) {
      this.koda = koda;
      return this;
    },
    json() {
      return this;
    }
  };
}

describe('Akcija – prekrivanje in trajanje', () => {
  it('9:00–13:00 in 12:00–16:00 se prekrivata', () => {
    assert.equal(akcija('09:00', '13:00').sePrekriva(akcija('12:00', '16:00')), true);
  });

  it('akciji, ki se le stikata, se ne prekrivata', () => {
    assert.equal(akcija('09:00', '12:00').sePrekriva(akcija('12:00', '16:00')), false);
  });

  it('ločeni akciji se ne prekrivata', () => {
    assert.equal(akcija('14:00', '16:00').sePrekriva(akcija('09:00', '11:00')), false);
  });

  it('9:00–13:00 traja 4 ure', () => {
    assert.equal(akcija('09:00', '13:00').trajanjeUr(), 4);
  });
});

describe('Validacija modelov', () => {
  it('akcija brez obveznih polj ni veljavna', () => {
    const napaka = new Akcija({}).validateSync();
    assert.ok(napaka.errors.naziv);
    assert.ok(napaka.errors.zacetek);
  });

  it('akcija mora imeti vsaj 1 mesto', () => {
    const a = akcija('09:00', '13:00');
    a.steviloMest = 0;
    assert.ok(a.validateSync().errors.steviloMest);
  });

  it('nova prijava ima status ODDANA', () => {
    const p = new Prijava({ studentId: new mongoose.Types.ObjectId(), akcijaId: new mongoose.Types.ObjectId() });
    assert.equal(p.status, 'ODDANA');
  });

  it('prijava z neznanim statusom ni veljavna', () => {
    const p = new Prijava({
      studentId: new mongoose.Types.ObjectId(),
      akcijaId: new mongoose.Types.ObjectId(),
      status: 'NEZNAN'
    });
    assert.ok(p.validateSync().errors.status);
  });
});

describe('Avtentikacija', () => {
  it('brez žetona vrne 401', () => {
    const res = odgovor();
    preveriZeton({ headers: {} }, res, () => {});
    assert.equal(res.koda, 401);
  });

  it('ustrezna vloga gre naprej', () => {
    let naprej = false;
    zahtevajVlogo('STUDENT')({ uporabnik: { vloga: 'STUDENT' } }, odgovor(), () => (naprej = true));
    assert.equal(naprej, true);
  });

  it('druga vloga dobi 403', () => {
    const res = odgovor();
    zahtevajVlogo('SKRBNIK')({ uporabnik: { vloga: 'STUDENT' } }, res, () => {});
    assert.equal(res.koda, 403);
  });
});
