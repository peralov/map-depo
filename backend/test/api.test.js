process.env.NODE_ENV = 'test';
process.env.SQLITE_DB_PATH = ':memory:';
process.env.SEED_DATABASE = 'false';
process.env.JWT_SECRET = 'test-secret';

const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const { app } = require('../server');
const { closeDatabase, initializeDatabase, run } = require('../models/database');

const listen = (app) => {
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${port}/api` });
    });
  });
};

const closeServer = (server) => {
  return new Promise((resolve, reject) => {
    server.close((err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

const request = async (baseUrl, path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(options.headers || {})
    }
  });

  const body = await response.json();
  return { response, body };
};

test('api workflows cover auth, sites, comments, reports, cleanups, and vouches', async (t) => {
  await initializeDatabase({ reset: true, seed: false });

  const adminPassword = bcrypt.hashSync('admin123', 10);
  await run(
    'INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)',
    ['admin', adminPassword, 'admin@example.com', 'admin']
  );

  const { server, baseUrl } = await listen(app);
  t.after(async () => {
    await closeServer(server);
    await closeDatabase();
  });

  const health = await request(baseUrl, '/health');
  assert.equal(health.response.status, 200);
  assert.equal(health.body.status, 'ok');

  const registered = await request(baseUrl, '/register', {
    method: 'POST',
    body: JSON.stringify({
      username: 'alice',
      email: 'alice@example.com',
      password: 'password123'
    })
  });

  assert.equal(registered.response.status, 200);
  assert.ok(registered.body.token);
  assert.equal(registered.body.user.username, 'alice');
  assert.equal(registered.body.user.role, 'public');
  const userToken = registered.body.token;

  const login = await request(baseUrl, '/login', {
    method: 'POST',
    body: JSON.stringify({
      username: 'alice',
      password: 'password123'
    })
  });

  assert.equal(login.response.status, 200);
  assert.equal(login.body.user.username, 'alice');

  const adminLogin = await request(baseUrl, '/login', {
    method: 'POST',
    body: JSON.stringify({
      username: 'admin',
      password: 'admin123'
    })
  });

  assert.equal(adminLogin.response.status, 200);
  assert.equal(adminLogin.body.user.role, 'admin');
  const adminToken = adminLogin.body.token;

  const invalidCoordinates = await request(baseUrl, '/sites', {
    method: 'POST',
    headers: { authorization: `Bearer ${userToken}` },
    body: JSON.stringify({
      name: 'Invalid Site',
      latitude: 91,
      longitude: 0
    })
  });
  assert.equal(invalidCoordinates.response.status, 400);

  const createdDepo = await request(baseUrl, '/sites', {
    method: 'POST',
    headers: { authorization: `Bearer ${userToken}` },
    body: JSON.stringify({
      name: 'Equator Test Site',
      description: 'A site at valid zero coordinates',
      latitude: 0,
      longitude: 0,
      status: 'high',
      type: 'plastic',
      size: 'large'
    })
  });

  assert.equal(createdDepo.response.status, 201);
  assert.equal(createdDepo.body.name, 'Equator Test Site');
  assert.equal(createdDepo.body.latitude, 0);
  assert.equal(createdDepo.body.longitude, 0);
  assert.equal(createdDepo.body.status, 'high');
  assert.equal(createdDepo.body.type, 'plastic');
  assert.equal(createdDepo.body.vouchCount, 0);
  assert.equal(createdDepo.body.reportedBy.username, 'alice');
  assert.ok(createdDepo.body.createdAt);
  const depoId = createdDepo.body.id;

  const invalidUpdate = await request(baseUrl, `/sites/${depoId}`, {
    method: 'PUT',
    headers: { authorization: `Bearer ${userToken}` },
    body: JSON.stringify({ name: '   ' })
  });
  assert.equal(invalidUpdate.response.status, 400);

  const updatedSite = await request(baseUrl, `/sites/${depoId}`, {
    method: 'PUT',
    headers: { authorization: `Bearer ${userToken}` },
    body: JSON.stringify({ status: 'medium' })
  });
  assert.equal(updatedSite.response.status, 200);
  assert.equal(updatedSite.body.status, 'medium');

  const depos = await request(baseUrl, '/sites');
  assert.equal(depos.response.status, 200);
  assert.equal(depos.body.length, 1);
  assert.equal(depos.body[0].createdAt, createdDepo.body.createdAt);

  const legacySite = await request(baseUrl, `/depos/${depoId}`);
  assert.equal(legacySite.response.status, 200);
  assert.equal(legacySite.body.id, depoId);

  const comment = await request(baseUrl, `/sites/${depoId}/comments`, {
    method: 'POST',
    headers: { authorization: `Bearer ${userToken}` },
    body: JSON.stringify({ content: 'Needs attention' })
  });

  assert.equal(comment.response.status, 201);
  assert.equal(comment.body.author.username, 'alice');
  assert.equal(comment.body.depoId, String(depoId));
  assert.ok(comment.body.createdAt);

  const comments = await request(baseUrl, `/sites/${depoId}/comments`);
  assert.equal(comments.response.status, 200);
  assert.equal(comments.body[0].author.username, 'alice');

  const report = await request(baseUrl, `/sites/${depoId}/reports`, {
    method: 'POST',
    headers: { authorization: `Bearer ${userToken}` },
    body: JSON.stringify({ details: 'Waste spread has increased' })
  });

  assert.equal(report.response.status, 201);
  assert.equal(report.body.status, 'pending');
  assert.equal(report.body.reporter.username, 'alice');
  const reportId = report.body.id;

  const forbiddenReports = await request(baseUrl, '/reports', {
    headers: { authorization: `Bearer ${userToken}` }
  });
  assert.equal(forbiddenReports.response.status, 403);

  const adminReports = await request(baseUrl, '/reports', {
    headers: { authorization: `Bearer ${adminToken}` }
  });
  assert.equal(adminReports.response.status, 200);
  assert.equal(adminReports.body.length, 1);

  const resolvedReport = await request(baseUrl, `/reports/${reportId}/status`, {
    method: 'PUT',
    headers: { authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ status: 'resolved' })
  });
  assert.equal(resolvedReport.response.status, 200);
  assert.equal(resolvedReport.body.status, 'resolved');

  const cleanup = await request(baseUrl, `/sites/${depoId}/cleanups`, {
    method: 'POST',
    headers: { authorization: `Bearer ${userToken}` },
    body: JSON.stringify({
      date: '2026-08-01',
      details: 'Bring bags and gloves'
    })
  });

  assert.equal(cleanup.response.status, 201);
  assert.equal(cleanup.body.organizer.username, 'alice');
  assert.equal(cleanup.body.status, 'scheduled');
  assert.equal(cleanup.body.participants.length, 1);

  const cleanups = await request(baseUrl, `/sites/${depoId}/cleanups`);
  assert.equal(cleanups.response.status, 200);
  assert.equal(cleanups.body[0].organizer.username, 'alice');
  assert.ok(cleanups.body[0].createdAt);

  const vouch = await request(baseUrl, `/sites/${depoId}/vouches`, {
    method: 'POST',
    headers: { authorization: `Bearer ${userToken}` }
  });

  assert.equal(vouch.response.status, 201);
  assert.equal(vouch.body.vouchCount, 1);
  assert.equal(vouch.body.user.username, 'alice');

  const duplicateVouch = await request(baseUrl, `/sites/${depoId}/vouches`, {
    method: 'POST',
    headers: { authorization: `Bearer ${userToken}` }
  });
  assert.equal(duplicateVouch.response.status, 400);

  const vouches = await request(baseUrl, `/sites/${depoId}/vouches`);
  assert.equal(vouches.response.status, 200);
  assert.equal(vouches.body.length, 1);
  assert.equal(vouches.body[0].createdAt, vouch.body.createdAt);
});
