/**
 * Site Studio: the content registry refuses what it doesn't know, every studio
 * route is admin-only, publish keeps a revision that rollback restores, team
 * writes keep the CRM's field names and refresh the public list, and Drive
 * imports refuse file types the site can't use. Run with: npm test
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
process.env.STUDIO_PREVIEW_SECRET ||= 'p'.repeat(40);

const express = (await import('express')).default;
const schema = await import('../src/shared/siteContentSchema.js');
const content = await import('../src/controllers/siteContent.controller.js');
const studio = await import('../src/controllers/studio.controller.js');
const { getTeam } = await import('../src/controllers/teamController.js');
const { default: siteContentRoutes } = await import('../src/routes/siteContent.routes.js');
const { default: studioRoutes } = await import('../src/routes/studio.routes.js');
const { errorHandler } = await import('../src/middlewares/errorHandler.js');
const { signAccessToken } = await import('../src/utils/jwt.js');
const { default: SiteContent } = await import('../src/models/SiteContent.js');
const { default: SiteContentRevision } = await import('../src/models/SiteContentRevision.js');
const { default: Team } = await import('../src/models/OurTeam.js');
const { User } = await import('../src/models/User.js');

/** Run an asyncHandler-wrapped controller and wait for its response or error. */
const call = (handler, req) =>
  new Promise((resolve) => {
    const res = {
      statusCode: 200,
      headers: {},
      setHeader(k, v) { this.headers[k] = v; },
      status(code) { this.statusCode = code; return this; },
      json(body) { resolve({ status: this.statusCode, body }); return this; },
    };
    handler({ user: { id: 'u1', role: 'admin' }, params: {}, query: {}, body: {}, ...req }, res, (error) => resolve({ error }));
  });

const chain = (value) => {
  const c = { select: () => c, sort: () => c, limit: () => c, lean: async () => value };
  return c;
};

const userWith = (user) => {
  const p = Promise.resolve(user);
  p.lean = async () => user;
  return { select: () => p };
};

describe('content registry', () => {
  it('rejects unknown keys and unknown fields', () => {
    assert.equal(schema.validateContent('page.secret', {}).ok, false);
    const r = schema.validateContent('home.hero', { headlineEnd: 'Hi', script: 'alert(1)' });
    assert.equal(r.ok, false);
    assert.match(r.errors.join(), /script is not an editable field/);
  });

  it('rejects bad values: colours, links, fonts, too-long text, javascript: urls', () => {
    assert.equal(schema.validateContent('theme', { primary: 'red' }).ok, false);
    assert.equal(schema.validateContent('theme', { fontBody: 'Comic Sans MS' }).ok, false);
    assert.equal(schema.validateContent('theme', { radius: 9 }).ok, false);
    assert.equal(schema.validateContent('home.hero', { headlineEnd: 'x'.repeat(61) }).ok, false);
    assert.equal(schema.validateContent('footer', { social: [{ network: 'linkedin', href: 'javascript:alert(1)' }] }).ok, false);
    assert.equal(schema.validateContent('nav', { items: [{ label: 'X', path: '//evil.example' }] }).ok, false);
    assert.equal(schema.validateContent('brand', { logo: 'data:image/svg+xml,<svg onload=alert(1)>' }).ok, false);
    const ok = schema.validateContent('theme', { primary: '#264A7F', radius: 0.5, fontDisplay: 'Sora' });
    assert.deepEqual(ok, { ok: true, value: { primary: '#264a7f', radius: 0.5, fontDisplay: 'Sora' }, errors: [] });
  });

  it('lenient cleaning keeps the good parts for the website', () => {
    assert.deepEqual(schema.cleanContent('home.hero', { headlineEnd: 'Free.', helper: 42, junk: 1 }), { headlineEnd: 'Free.' });
    assert.deepEqual(schema.cleanContent('home.hero', 'not an object'), {});
  });

  it('rich text keeps formatting and loses scripts, handlers and bad links', () => {
    const out = schema.sanitizeRichText(
      '<p onclick="x()">Hi <b>there</b><script>alert(1)</script><img src=x onerror=alert(1)> <a href="javascript:alert(1)">a</a> <a href="https://recruitkr.com">b</a></p>',
    );
    assert.equal(out, '<p>Hi <b>there</b> <a>a</a> <a href="https://recruitkr.com" rel="noopener noreferrer">b</a></p>');
  });

  it('refuses SVGs that can run code or load things', () => {
    assert.ok(schema.sanitizeSvg('<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0h1"/></svg>'));
    assert.equal(schema.sanitizeSvg('<svg><script>alert(1)</script></svg>'), null);
    assert.equal(schema.sanitizeSvg('<svg onload="alert(1)"></svg>'), null);
    assert.equal(schema.sanitizeSvg('<svg><a href="https://evil.example"><path/></a></svg>'), null);
  });
});

describe('studio routes are admin-only', () => {
  let server;
  let base;
  const realFindById = User.findById;
  const realFind = SiteContent.find;

  before(async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/v1/site-content', siteContentRoutes);
    app.use('/api/v1/studio', studioRoutes);
    app.use(errorHandler);
    await new Promise((resolve) => { server = app.listen(0, resolve); });
    base = `http://127.0.0.1:${server.address().port}/api/v1`;
    User.findById = () => userWith({ id: '64b000000000000000000001', role: 'candidate', passwordChangedAt: null });
    SiteContent.find = () => chain([{ key: 'home.hero', published: { headlineEnd: 'Free.', junk: 1 } }, { key: 'gone', published: {} }]);
  });

  after(() => {
    server.close();
    User.findById = realFindById;
    SiteContent.find = realFind;
  });

  const routes = [
    ['GET', '/site-content'],
    ['POST', '/site-content/preview-token'],
    ['POST', '/site-content/publish-all'],
    ['PUT', '/site-content/brand'],
    ['POST', '/site-content/brand/publish'],
    ['POST', '/site-content/brand/discard'],
    ['GET', '/site-content/brand/revisions'],
    ['POST', '/site-content/brand/rollback/64b000000000000000000002'],
    ['GET', '/studio/media'],
    ['POST', '/studio/media'],
    ['POST', '/studio/media/from-drive'],
    ['GET', '/studio/team'],
    ['POST', '/studio/team'],
    ['PUT', '/studio/team/reorder'],
    ['PUT', '/studio/team/64b000000000000000000002'],
    ['PATCH', '/studio/team/64b000000000000000000002/active'],
  ];

  it('refuses every studio route without a login (401) and for non-admins (403)', async () => {
    const candidate = signAccessToken({ userId: '64b000000000000000000001', role: 'candidate' });
    for (const [method, path] of routes) {
      const anon = await fetch(base + path, { method });
      assert.equal(anon.status, 401, `${method} ${path} without login`);
      const res = await fetch(base + path, { method, headers: { Authorization: `Bearer ${candidate}` } });
      assert.equal(res.status, 403, `${method} ${path} as a candidate`);
    }
  });

  it('serves published content publicly, cleaned, with cache headers', async () => {
    const res = await fetch(`${base}/site-content/published`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('cache-control'), /s-maxage=300/);
    assert.deepEqual((await res.json()).data, { 'home.hero': { headlineEnd: 'Free.' } });
  });

  it('only shows drafts to a valid, unexpired preview token', async () => {
    assert.equal((await fetch(`${base}/site-content/preview?token=forged.token`)).status, 401);
    assert.equal(content.verifyPreviewToken(content.makePreviewToken()), true);
    assert.equal(content.verifyPreviewToken(content.makePreviewToken(Date.now() - 3 * 60 * 60 * 1000)), false);
  });
});

describe('publish and rollback', () => {
  const docs = new Map();
  const revisions = [];
  const real = {
    find: SiteContent.find, findOne: SiteContent.findOne, updateOne: SiteContent.updateOne,
    rCreate: SiteContentRevision.create, rFind: SiteContentRevision.find, rFindOne: SiteContentRevision.findOne,
    rUpdate: SiteContentRevision.updateOne, findById: User.findById,
  };

  before(() => {
    SiteContent.find = () => chain([...docs.values()]);
    SiteContent.findOne = ({ key }) => chain(docs.get(key) ? { ...docs.get(key) } : null);
    SiteContent.updateOne = async ({ key }, update, opts = {}) => {
      if (!docs.has(key)) {
        if (!opts.upsert) return;
        docs.set(key, { key, ...(update.$setOnInsert || {}) });
      }
      Object.assign(docs.get(key), update.$set);
    };
    SiteContentRevision.create = async (doc) => {
      const row = { _id: `64b0000000000000000000${String(revisions.length + 10).padStart(2, '0')}`, ...doc };
      revisions.push(row);
      return row;
    };
    SiteContentRevision.find = ({ key }) => chain(revisions.filter((r) => r.key === key).sort((a, b) => b.version - a.version));
    SiteContentRevision.findOne = ({ _id, key }) => chain(revisions.find((r) => r._id === _id && r.key === key) || null);
    SiteContentRevision.updateOne = async () => {};
    User.findById = () => userWith({ email: 'admin@test.local' });
  });

  after(() => {
    Object.assign(SiteContent, { find: real.find, findOne: real.findOne, updateOne: real.updateOne });
    Object.assign(SiteContentRevision, { create: real.rCreate, find: real.rFind, findOne: real.rFindOne, updateOne: real.rUpdate });
    User.findById = real.findById;
  });

  beforeEach(() => {
    docs.clear();
    revisions.length = 0;
  });

  it('refuses to save an invalid draft', async () => {
    const r = await call(content.saveDraft, { params: { key: 'theme' }, body: { value: { primary: 'blue' } } });
    assert.equal(r.error.statusCode, 400);
    assert.equal(docs.size, 0);
  });

  it('every publish is a revision, and rollback brings an old one back', async () => {
    await call(content.saveDraft, { params: { key: 'home.hero' }, body: { value: { headlineEnd: 'First.' } } });
    assert.equal(docs.get('home.hero').published, null, 'saving a draft does not publish it');
    const p1 = await call(content.publishKey, { params: { key: 'home.hero' } });
    assert.equal(p1.body.data.version, 1);

    await call(content.saveDraft, { params: { key: 'home.hero' }, body: { value: { headlineEnd: 'Second.' } } });
    await call(content.publishKey, { params: { key: 'home.hero' } });
    assert.deepEqual(docs.get('home.hero').published, { headlineEnd: 'Second.' });
    assert.equal(revisions.length, 2);

    const first = revisions.find((r) => r.version === 1);
    const rb = await call(content.rollback, { params: { key: 'home.hero', revisionId: first._id } });
    assert.equal(rb.body.data.restored, 1);
    assert.deepEqual(docs.get('home.hero').published, { headlineEnd: 'First.' });
    assert.equal(revisions.length, 3, 'a rollback is itself a new revision');
    assert.equal(revisions[2].note, 'Restored version 1');
    assert.equal(revisions[2].publishedBy, 'admin@test.local');
  });

  it('publish-all is all or nothing', async () => {
    docs.set('footer', { key: 'footer', draft: { heading: 'Hello' }, published: null, version: 0 });
    docs.set('theme', { key: 'theme', draft: { primary: 'not-a-colour' }, published: null, version: 0 });
    const r = await call(content.publishAll, {});
    assert.equal(r.error.statusCode, 400);
    assert.equal(docs.get('footer').published, null);
    assert.equal(revisions.length, 0);
  });
});

describe('team manager', () => {
  const real = { create: Team.create, findOne: Team.findOne, find: Team.find, update: Team.findByIdAndUpdate };
  after(() => Object.assign(Team, { create: real.create, findOne: real.findOne, find: real.find, findByIdAndUpdate: real.update }));

  it('writes every alias field the CRM and the public list read, and refreshes the public list', async () => {
    let reads = 0;
    Team.find = () => { reads += 1; return chain([]); };
    const res = { setHeader() {}, status() { return this; }, json() {} };
    await getTeam({}, res);
    await getTeam({}, res);
    assert.equal(reads, 1, 'second read comes from the cache');

    let created;
    Team.findOne = () => chain({ displayOrder: 7 });
    Team.create = async (doc) => { created = doc; return { _id: '64b000000000000000000003', ...doc }; };
    const r = await call(studio.createMember, {
      body: { name: 'Neha Sharma', role: 'Recruiter', summary: 'Hires for retail', image: 'https://ik.imagekit.io/x/n.jpg',
        video: 'https://ik.imagekit.io/x/n.mp4', linkedin: 'https://www.linkedin.com/in/neha', email: 'NEHA@Example.com' },
    });
    assert.equal(r.status, 201);
    assert.equal(created.fullName, 'Neha Sharma');
    assert.equal(created.name, 'Neha Sharma');
    assert.equal(created.role, 'Recruiter');
    assert.equal(created.position, 'Recruiter');
    assert.equal(created.shortDescription, 'Hires for retail');
    assert.equal(created.profileImage, 'https://ik.imagekit.io/x/n.jpg');
    assert.equal(created.profileVideo, created.videoUrl);
    assert.equal(created.linkedInUrl, 'https://www.linkedin.com/in/neha');
    assert.equal(created.email, 'neha@example.com');
    assert.equal(created.displayOrder, 8);
    assert.equal(created.active && created.isActive, true);

    await getTeam({}, res);
    assert.equal(reads, 2, 'the write cleared the public cache');
  });

  it('hides instead of deleting, on both active flags', async () => {
    let update;
    Team.findByIdAndUpdate = (_id, u) => { update = u; return chain({ _id, fullName: 'X', active: false, isActive: false }); };
    const r = await call(studio.setMemberActive, { params: { id: '64b000000000000000000003' }, body: { active: false } });
    assert.deepEqual(update, { $set: { active: false, isActive: false } });
    assert.equal(r.body.data.active, false);
  });
});

describe('media', () => {
  const realFetch = globalThis.fetch;
  after(() => { globalThis.fetch = realFetch; });

  it('refuses a Drive file of a type the site cannot use', async () => {
    const urls = [];
    globalThis.fetch = async (url) => {
      urls.push(String(url));
      return new Response(JSON.stringify({ name: 'setup.exe', mimeType: 'application/x-msdownload', size: '1000' }), { status: 200 });
    };
    const r = await call(studio.importFromDrive, { body: { fileId: '1AbCdEfGhIjKlMnOp', accessToken: 'ya29.'.padEnd(40, 'x') } });
    assert.equal(r.error.statusCode, 400);
    assert.match(r.error.message, /can't be used on the site/);
    assert.equal(urls.length, 1, 'the file itself is never downloaded');
  });

  it('checks the real bytes, not the claimed type', async () => {
    const exe = Buffer.concat([Buffer.from('MZ'), Buffer.alloc(100)]);
    await assert.rejects(studio.storeMedia({ buffer: exe, name: 'logo.png', declaredType: 'image/png' }), /Only JPG, PNG/);
    const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(100)]);
    await assert.rejects(studio.storeMedia({ buffer: png, name: 'x.jpg', declaredType: 'image/jpeg' }), /says it is image\/jpeg/);
    assert.equal(studio.sniffMediaType(Buffer.from('<?xml version="1.0"?><svg xmlns="x"></svg>')), 'image/svg+xml');
  });
});
