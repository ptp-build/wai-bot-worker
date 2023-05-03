import BaseStorage from './BaseStorage';

export default class CloudFlareR2 extends BaseStorage{
	private STORAGE?: any;
	private getStorage(){
		return this.STORAGE!
	}
	init(STORAGE: any) {
		this.STORAGE = STORAGE;
	}
	//
	async put(path: string, data: any) {
		console.debug("[storage put]",path)
		return await this.invoke({ action: 'PUT', path, data });
	}

	async get(path: string) {
		console.debug("[storage get]",path)
		return await this.invoke({ action: 'GET', path });
	}

	async delete(path: string) {
		console.debug("[storage delete]",path)
		return await this.invoke({ action: 'DELETE', path });
	}

	async invoke({
								 path,
								 data,
								 action,
							 }: {
		path: string;
		data?: any;
		action: 'PUT' | 'GET' | 'DELETE';
	}) {
		switch (action) {
			case 'PUT':
				await this.getStorage().put(path, data);
				return;
			case 'GET':
				const object = await this.getStorage().get(path);
				if (!object) {
					return null;
				}
				const body = await object.arrayBuffer();
				return Buffer.from(body);
			case 'DELETE':
				await this.getStorage().delete(path);
				return;
			default:
				break;
		}
		return null
	}
}
