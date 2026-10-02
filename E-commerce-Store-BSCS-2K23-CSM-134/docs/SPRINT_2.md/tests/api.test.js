process.env.DATABASE_URL=process.env.DATABASE_URL||'postgresql://postgres:postgres@localhost:5432/mobile_store';
process.env.JWT_SECRET=process.env.JWT_SECRET||'test-secret';
const request=require('supertest'); const app=require('../src/app');

test('health endpoint works without database',async()=>{const r=await request(app).get('/health');expect(r.status).toBe(200);expect(r.body.status).toBe('ok');});
test('admin category route rejects unauthenticated request',async()=>{const r=await request(app).get('/api/v1/admin/categories');expect(r.status).toBe(401);expect(r.body.error.code).toBe('AUTH_REQUIRED');});
test('admin product route rejects unauthenticated write',async()=>{const r=await request(app).post('/api/v1/admin/products').send({name:'Test',brand:'Test',slug:'test',category_id:1});expect(r.status).toBe(401);});
