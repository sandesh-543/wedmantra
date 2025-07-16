const redisManager = require('../src/config/redis');
const { CacheService } = require('../src/services/cacheService');

async function testRedisConnection() {
  console.log('Testing Redis Connection...\n');
  
  try {
    // Wait for initial connection attempt
    console.log('Waiting for Redis connection...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Force connection attempt
    console.log('Attempting manual connection...');
    await redisManager.connect();
    
    // Check debug status
    await CacheService.debugStatus();
    
    // Test basic operations
    console.log('Testing cache operations...');
    
    // Test SET
    const testKey = 'test:connection';
    const testData = { message: 'Hello Redis!', timestamp: new Date().toISOString() };
    
    console.log('1. Testing SET...');
    const setResult = await CacheService.set(testKey, testData, 60);
    console.log('SET result:', setResult ? 'Success' : 'Failed');
    
    // Test GET
    console.log('2. Testing GET...');
    const getData = await CacheService.get(testKey);
    console.log('GET result:', getData ? 'Success' : 'Failed');
    console.log('Retrieved data:', getData);
    
    // Test cache wrapper
    console.log('3. Testing cacheWrapper...');
    let dbCallCount = 0;
    const mockDbQuery = async () => {
      dbCallCount++;
      console.log(`DB Query executed (call #${dbCallCount})`);
      return { data: 'from database', callNumber: dbCallCount };
    };
    
    // First call should hit DB
    const result1 = await CacheService.cacheWrapper('test:wrapper', mockDbQuery, 60);
    console.log('First call result:', result1);
    
    // Second call should hit cache
    const result2 = await CacheService.cacheWrapper('test:wrapper', mockDbQuery, 60);
    console.log('Second call result:', result2);
    
    console.log('DB was called', dbCallCount, 'times (should be 1 if cache working)');
    
    // Test DELETE
    console.log('4. Testing DELETE...');
    const delResult = await CacheService.del(testKey);
    console.log('DELETE result:', delResult ? 'Success' : 'Failed');
    
    // Test GET after delete
    console.log('5. Testing GET after DELETE...');
    const getAfterDel = await CacheService.get(testKey);
    console.log('GET after DELETE:', getAfterDel === null ? 'Correctly null' : 'Still cached');
    
    // Cleanup
    await CacheService.del('test:wrapper');
    
    if (setResult && getData && dbCallCount === 1) {
      console.log('\n Redis test PASSED! Cache is working correctly.');
    } else {
      console.log('\n Redis test FAILED! Cache is not working.');
    }
    
  } catch (error) {
    console.error('Redis test failed:', error);
  } finally {
    // Disconnect and exit
    await redisManager.disconnect();
    process.exit(0);
  }
}

// Run the test
testRedisConnection();