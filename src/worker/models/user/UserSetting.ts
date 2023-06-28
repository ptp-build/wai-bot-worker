import KvCache from '../../services/kv/KvCache';
const KEY = 'U_ST_K';

export default class UserSetting {
  private readonly userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async getValue(key: string) {
    const str = await KvCache.getInstance().get(`${KEY}_${this.userId}_${key}`);
    return str || '';
  }

  async setValue(key: string, value: string) {
    await KvCache.getInstance().put(`${KEY}_${this.userId}_${key}`, value);
  }
}
