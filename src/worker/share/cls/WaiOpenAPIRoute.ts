import {kv} from '../../env';

import {Pdu} from '../../../lib/ptp/protobuf/BaseMsg';
import Account from '../Account';
import {AuthSessionType, genUserId} from '../service/User';
import UserBalance from '../service/UserBalance';
import BaseOpenAPIRoute from "./BaseOpenAPIRoute";

export default class WaiOpenAPIRoute extends BaseOpenAPIRoute {
  private authSession: AuthSessionType | undefined;
  getAuthSession() {
    return this.authSession;
  }
  async getUserTotalEarn() {
    return await new UserBalance(this.authSession?.authUserId!).getTotalEarn();
  }
  async getUserBalance() {
    return await new UserBalance(this.authSession?.authUserId!).getBalance();
  }
  async getUserTotalSpend() {
    return await new UserBalance(this.authSession?.authUserId!).getTotalSpend();
  }
  async checkIfTokenIsInvalid(request: Request) {
    const auth = request.headers.get('Authorization');
    if (!auth) {
      return WaiOpenAPIRoute.responseError('Authorization invalid', 400);
    }

    if (auth) {
      const token = auth.replace('Bearer ', '');
      if (token.indexOf('_') === -1) {
        return WaiOpenAPIRoute.responseError('Authorization is null', 400);
      }
      const res = token.split('_');
      const sign = res[0];
      const ts = parseInt(res[1]);
      const clientId = parseInt(res[3]);
      const account = new Account(ts);
      const { address } = account.recoverAddressAndPubKey(Buffer.from(sign, 'hex'), ts.toString());
      if (!address) {
        return WaiOpenAPIRoute.responseError('Authorization error', 400);
      }
      Account.setServerKv(kv);
      let authUserId = await account.getUidFromCacheByAddress(address);
      if (!authUserId) {
        authUserId = await genUserId();
        await new UserBalance(authUserId).firstLogin();
        await account.saveUidFromCacheByAddress(authUserId, authUserId);
      }
      this.authSession = {
        address,
        authUserId,
        ts,
        clientId,
      };
      console.log('[checkTokenIsInvalid]', JSON.stringify(this.authSession));
    }
    return false;
  }

  static responsePdu(data: Pdu, status = 200) {
    return WaiOpenAPIRoute.responseBuffer(Buffer.from(data.getPbData()), status);
  }
}
