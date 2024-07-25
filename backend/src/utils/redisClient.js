// redisClient.js
import Redis from 'ioredis';

const redis = new Redis({
  host: '127.0.0.1', // Localhost
  port: 6379,        // Default Redis port
});

redis.on('connect', () => {
    console.log('Connected to Redis successfully');
  });
  


redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});



export default redis;
