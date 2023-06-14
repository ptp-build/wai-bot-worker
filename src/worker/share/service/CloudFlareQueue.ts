import {Message} from "../../index";

export default class CloudFlareQueue {
  async process(message:Message<Body>){
    console.log("[process queue msg]",message.body.text)
  }
}
