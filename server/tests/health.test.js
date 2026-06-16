const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');

describe('GET /api/health', () => {
  afterAll(async () => {
    // Close the MongoDB connection opened by index.js to allow Jest to exit cleanly
    await mongoose.connection.close();
  });

  it('should return 200 OK and health status', async () => {
    const res = await request(app).get('/api/health');
    if (res.statusCode !== 200) console.log('ERROR RESPONSE:', res.text);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('message', 'Server is running');
    expect(res.body).toHaveProperty('timestamp');
  });
});
