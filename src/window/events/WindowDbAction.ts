import {WindowDbActionData} from "../../types";
import {HttpRequestStorage} from "../../worker/models/mysql/HttpRequestStorage";

export default class WindowDbAction {

  async process({action,payload}:WindowDbActionData){
    switch (action){
      case "saveHttpRequest":
        return this.saveHttpRequest(payload);
    }
  }
  async saveHttpRequest({rows}:{rows:any[]}){
    rows.forEach((row)=>{
      new HttpRequestStorage().add(row)
    })
  }
}
