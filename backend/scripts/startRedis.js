const { spawn } = require('child_process');

function startRedis() {
  console.log('Starting Redis server...');
  
  const redis = spawn('redis-server', [], {
    stdio: 'inherit'
  });
  
  redis.on('error', (error) => {
    console.error('Failed to start Redis:', error.message);
    console.log('\n Install Redis:');
    console.log('Windows: Download from https://redis.io/download');
    console.log('macOS: brew install redis');
    console.log('Ubuntu: sudo apt install redis-server');
  });
  
  redis.on('exit', (code) => {
    console.log(`Redis server exited with code ${code}`);
  });
  
  // Handle Ctrl+C
  process.on('SIGINT', () => {
    console.log('\n Stopping Redis server...');
    redis.kill('SIGINT');
    process.exit(0);
  });
}

if (require.main === module) {
  startRedis();
}

module.exports = { startRedis };