export default class Html5CacheHelper {
  private cache?: Cache;
  private cacheName?:string

  init(cacheName: string) {
    this.cacheName = cacheName;
    return this
  }

  async initCache(cacheName:string) {
    this.cache = await caches.open(cacheName)
  }

  async get(key: string) {

    if(!this.cache){
      await this.initCache(this.cacheName!)
    }
    return this.cache!.match(new Request(key)).then((response) => {
      if (response) {
        return response;
      } else {
        return null;
      }
    });
  }

  async delete(key: string) {


    if(!this.cache){
      await this.initCache(this.cacheName!)
    }
    return this.cache!.delete(key);
  }

  async put(key: string, value: any) {
    if(!this.cache){
      await this.initCache(this.cacheName!)
    }
    const response = new Response(value);
    return this.cache!.put(key, response);
  }
}
