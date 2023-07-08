export type ShowModalFromEventPayload = {
  title?:string,
  type?:'singleInput'|'multipleInput',
  placeholder?:string,
  initVal?:string | number
  max?:number
  min?:number
  step?:number
  showQrcode?:boolean
  inputType?:string
  buttonTxt?:string
  description?:string|string[]
}
export type ShowModalFromEventResult = {
  value?:string,
}

export async function showModalFromEvent(payload:ShowModalFromEventPayload){
  return new Promise<ShowModalFromEventResult>((resolve)=>{
    const event = new CustomEvent('modal',{
      detail:{
        payload,
        callback:(res:ShowModalFromEventResult)=>{
          resolve(res)
        }
      }
    });
    document.dispatchEvent(event);
  })
}
