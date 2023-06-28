import BaseStorage from "./BaseStorage";

export default class Html5Cache extends BaseStorage {
  private cache?: Cache;

  init(cacheName: string) {
    return caches.open(cacheName).then((cache) => {
      this.cache = cache;
    });
    return this
  }

  get(key: string, force?: boolean) {
    return this.cache!.match(key).then((response) => {
      if (response && !force) {
        return response.json();
      } else {
        return null;
      }
    });
  }

  async delete(key: string) {
    return this.cache!.delete(key);
  }

  async put(key: string, value: any) {
    const response = new Response(JSON.stringify(value));
    return this.cache!.put(key, response);
  }
}
