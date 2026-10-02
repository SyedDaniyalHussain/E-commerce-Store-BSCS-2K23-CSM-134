const app=require('./app'); const env=require('./config/env'); const server=app.listen(env.port,()=>console.log(`Mobile Store API running on http://localhost:${env.port}`));
process.on('SIGTERM',()=>server.close(()=>process.exit(0)));
