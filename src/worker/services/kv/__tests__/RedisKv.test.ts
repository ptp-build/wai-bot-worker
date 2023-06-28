import {RedisKv} from "../RedisKv";
describe('RedisKv', () => {
  let redisKv:RedisKv;
  beforeAll(async () => {
    // @ts-ignore
    redisKv = new RedisKv().init(global['RedisConfig'])
  });

  afterAll(async () => {

  });

  describe('get', () => {
    it('should retrieve the value for the given key', async () => {
      const key = 'key1';
      const value = "value";
      await redisKv.put(key,value);
      const result = await redisKv.get(key);
      expect(result).toEqual(value);

      const result1 = await redisKv.get("test");
      expect(result1).toEqual(null);

      const result2 = await redisKv.delete(key);
      expect(result2).toEqual(true);

      const result3 = await redisKv.get(key);
      expect(result3).toEqual(null);
    });
  });

  describe('get', () => {
    it('should retrieve the int value for the given key', async () => {
      const key = 'key1';
      const value = 1;
      await redisKv.put(key,value);
      const result = await redisKv.get(key);
      expect(result).toEqual(value);
    });
  });

  describe('get', () => {
    it('should retrieve the bool value for the given key', async () => {
      const key = 'key1';
      const value = true;
      await redisKv.put(key,value);
      const result = await redisKv.get(key);
      expect(result).toEqual(value);
    });
  });

  describe('get', () => {
    it('should retrieve the object value for the given key', async () => {
      const key = 'key1';
      const value = {test:1};
      await redisKv.put(key,value);
      const result = await redisKv.get(key);
      expect(result.test).toEqual(value.test);
    });
  });
});
