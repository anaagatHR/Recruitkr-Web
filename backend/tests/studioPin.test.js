/**
 * Site Studio PIN sign-in: the right PIN opens every Studio route for 8 hours,
 * a wrong or forged one opens nothing, and repeated guessing locks it.
 * Uses a made-up test PIN. Run with: npm test
 */
import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';

process.env.MONGODB_URI ||= 'mongodb://localhost/test';
process.env.JWT_ACCESS_SECRET ||= 'a'.repeat(40);
process.env.JWT_REFRESH_SECRET ||= 'b'.repeat(40);
process.env.IMAGEKIT_PUBLIC_KEY ||= 'public_test_key';
process.env.IMAGEKIT_PRIVATE_KEY ||= 'private_test_key';
process.env.IMAGEKIT_URL_ENDPOINT ||= 'https://ik.imagekit.io/test';
process.env.BCRYPT_OR_ARGON2_PEPPER ||= 'pepper'.repeat(4);
process.env.STUDIO_PIN = '12345678';

const express = (await import('express')).default;
const { default: siteContentRoutes } = await import('../src/routes/siteContent.routes.js');
const { default: studioRoutes } = await import('../src/routes/studio.routes.js');
const { errorHandler } = await import('../src/middlewares/errorHandler.js');
const pin = await import('../src/middlewares/studioAuth.js');
const { env } = await import('../src/config/env.js');
const { default: SiteContent } = await import('../src/models/SiteContent.js');
const { default: Team } = await import('../src/models/OurTeam.js');

const chain = (value) => {
  const c = { select: () => c, sort: () => c, limit: () => c, lean: async () => value };
  return c;
};

describe('Studio PIN sign-in', () => {
  let server;
  let base;
  const real = { find: SiteContent.find, teamFind: Team.find };

  before(async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/v1/site-content', siteContentRoutes);
    app.use('/api/v1/studio', studioRoutes);
    app.use(errorHandler);
    await new Promise((resolve) => {
      server = app.listen(0, resolve);
    });
    base = `http://127.0.0.1:${server.address().port}/api/v1`;
    SiteContent.find = () => chain([]);
    Team.find = () => chain([]);
  });

  after(() => {
    server.close();
    SiteContent.find = real.find;
    Team.find = real.teamFind;
  });

  beforeEach(() => pin.resetPinFailures());

  const login = (value) =>
    fetch(`${base}/site-content/pin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: value }),
    });

  it('opens the Studio with the right PIN and refuses a wrong one', async () => {
    assert.equal((await login('00000000')).status, 401);
    const ok = await login('12345678');
    assert.equal(ok.status, 200);
    const { token } = (await ok.json()).data;
    assert.match(token, /^studio\./);
    const auth = { headers: { Authorization: `Bearer ${token}` } };
    assert.equal((await fetch(`${base}/site-content`, auth)).status, 200);
    assert.equal((await fetch(`${base}/studio/team`, auth)).status, 200);
    assert.equal((await fetch(`${base}/site-content`)).status, 401, 'no token, no entry');
  });

  it('refuses forged and expired Studio tokens, and tokens from an old PIN', async () => {
    const forged = `${pin.makeStudioToken().slice(0, -4)}AAAA`;
    assert.equal((await fetch(`${base}/site-content`, { headers: { Authorization: `Bearer ${forged}` } })).status, 401);
    assert.equal(pin.verifyStudioToken(pin.makeStudioToken(Date.now() - 9 * 60 * 60 * 1000)), false);
    const issued = pin.makeStudioToken();
    env.STUDIO_PIN = '87654321';
    assert.equal(pin.verifyStudioToken(issued), false, 'changing the PIN signs everyone out');
    env.STUDIO_PIN = '12345678';
    assert.equal(pin.verifyStudioToken(issued), true);
  });

  it('locks PIN sign-in after many wrong guesses, even with the right PIN', async () => {
    for (let i = 0; i < 30; i += 1) {
       
      await new Promise((resolve) => {
        pin.pinLogin({ body: { pin: 'wrong-pin' } }, {}, resolve);
      });
    }
    assert.equal((await login('12345678')).status, 429);
  });

  it('is off when STUDIO_PIN is not set', async () => {
    env.STUDIO_PIN = undefined;
    try {
      assert.equal((await login('12345678')).status, 503);
      assert.equal(pin.verifyStudioToken(pin.makeStudioToken()), false);
    } finally {
      env.STUDIO_PIN = '12345678';
    }
  });
});
