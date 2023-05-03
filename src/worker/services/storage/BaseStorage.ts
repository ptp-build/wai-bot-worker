export default abstract class BaseStorage {
  abstract init(STORAGE: any): void

  abstract put(path: string, data: any): Promise<any>

  abstract get(path: string): Promise<any>

  abstract delete(path: string): Promise<any>
}
