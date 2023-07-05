export function generateRandomString(length:number) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export function generateUniqueId() {
  // Check if the crypto object is available
  if (typeof window.crypto === 'undefined' || typeof window.crypto.getRandomValues !== 'function') {
    console.error('Web Cryptography API is not supported in this browser');
    return null;
  }

  // Create a Uint8Array to store random values
  const array = new Uint8Array(16);

  // Generate random values and fill the array
  window.crypto.getRandomValues(array);

  // Convert the array to a hexadecimal string
  let id = '';
  for (let i = 0; i < array.length; i++) {
    id += ('0' + array[i].toString(16)).slice(-2);
  }

  return id;
}


export function encodeToBase64(input: string) {
  try {
    // Convert the input string to Base64
    return btoa(unescape(encodeURIComponent(input)));
  } catch (e) {
    console.error('Failed to encode base64:', e);
    return null;
  }
}

export function decodeFromBase64(input: string) {
  try {
    // Decode the Base64 string back to the original string
    return decodeURIComponent(escape(atob(input)));
  } catch (e) {
    console.error('Failed to decode base64:', e);
    return null;
  }
}

export function parseCallBackButtonPayload(data:string,type:"hex"|"base64" = "base64"){
  const t  = type === "hex" ?  data.split("/hex") :  data.split("/base64")
  if(t.length === 2){
    let params
    if(type === "hex"){
      params =  JSON.parse(Buffer.from(t[1],'hex').toString())
    }else{
      const tt = decodeFromBase64(t[1])
      console.log(t,tt)
      params =  JSON.parse(tt!)
    }
    return {
      path:t[0],
      params
    }
  }else{
    return {
      path: data,
      params:undefined
    }
  }
}

export function encodeCallBackButtonPayload(data:string,payload?:any,type:"hex"|"base64" = "base64"){
  if(payload){
    if(type === "hex"){
      return `${data}/hex${Buffer.from(JSON.stringify(payload)).toString("hex")}`
    }else{
      return `${data}/base64${encodeToBase64(JSON.stringify(payload))}`
    }
  }else{
    return data
  }
}


export function replaceSubstring(text:string, offset:number, length:number,replace:string) {
  const prefix = text.substring(0, offset);
  const suffix = text.substring(offset + length);
  return prefix + replace + suffix;
}

