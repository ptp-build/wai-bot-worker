export function generateRandomString(length:number) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export function sha1(str: string): string {
  function utf8_encode(str: string): string {
    str = str.replace(/\r\n/g, '\n');
    let utf8str = '';
    for (let n = 0; n < str.length; n++) {
      let c = str.charCodeAt(n);
      if (c < 128) {
        utf8str += String.fromCharCode(c);
      } else if ((c > 127) && (c < 2048)) {
        utf8str += String.fromCharCode((c >> 6) | 192);
        utf8str += String.fromCharCode((c & 63) | 128);
      } else {
        utf8str += String.fromCharCode((c >> 12) | 224);
        utf8str += String.fromCharCode(((c >> 6) & 63) | 128);
        utf8str += String.fromCharCode((c & 63) | 128);
      }
    }
    return utf8str;
  }

  function rotate_left(n: number, s: number): number {
    return (n << s) | (n >>> (32 - s));
  }

  function cvt_hex(val: number): string {
    let str = '';
    let i;
    let v;
    for (i = 7; i >= 0; i--) {
      v = (val >>> (i * 4)) & 0x0f;
      str += v.toString(16);
    }
    return str;
  }

  let blockstart;

  let i: number, j: number;

  let W = new Array(80);

  let H0 = 0x67452301;
  let H1 = 0xEFCDAB89;
  let H2 = 0x98BADCFE;
  let H3 = 0x10325476;
  let H4 = 0xC3D2E1F0;

  let A, B, C, D, E;

  let temp;

  str = utf8_encode(str);

  let len = str.length * 8;

  let K = new Array(
    0x5A827999,
    0x6ED9EBA1,
    0x8F1BBCDC,
    0xCA62C1D6
  );

  let str_len = str.length;

  let word_array = new Array();

  for (i = 0; i < str_len - 3; i += 4) {
    j =
      (str.charCodeAt(i) << 24) |
      (str.charCodeAt(i + 1) << 16) |
      (str.charCodeAt(i + 2) << 8) |
      str.charCodeAt(i + 3);
    word_array.push(j);
  }

  switch (str_len % 4) {
    case 0:
      i = 0x080000000;
      break;
    case 1:
      i = (str.charCodeAt(str_len - 1) << 24) | 0x0800000;
      break;

    case 2:
      i =
        (str.charCodeAt(str_len - 2) << 24) |
        (str.charCodeAt(str_len - 1) << 16) |
        0x08000;
      break;

    case 3:
      i =
        (str.charCodeAt(str_len - 3) << 24) |
        (str.charCodeAt(str_len - 2) << 16) |
        (str.charCodeAt(str_len - 1) << 8) |
        0x80;
      break;
  }

  word_array.push(i);

  while (word_array.length % 16 != 14) word_array.push(0);

  word_array.push(len >>> 32);
  word_array.push(len & 0xffffffff);

  for (blockstart = 0; blockstart < word_array.length; blockstart += 16) {
    for (i = 0; i < 16; i++) W[i] = word_array[blockstart + i];
    for (i = 16; i < 80; i++)
      W[i] = rotate_left(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16], 1);

    A = H0;
    B = H1;
    C = H2;
    D = H3;
    E = H4;

    for (i = 0; i < 20; i++) {
      temp =
        (rotate_left(A, 5) + ((B & C) | (~B & D)) + E + W[i] + K[0]) &
        0xffffffff;
      E = D;
      D = C;
      C = rotate_left(B, 30);
      B = A;
      A = temp;
    }

    for (i = 20; i < 40; i++) {
      temp = (rotate_left(A, 5) + (B ^ C ^ D) + E + W[i] + K[1]) & 0xffffffff;
      E = D;
      D = C;
      C = rotate_left(B, 30);
      B = A;
      A = temp;
    }

    for (i = 40; i < 60; i++) {
      temp =
        (rotate_left(A, 5) + ((B & C) | (B & D) | (C & D)) + E + W[i] + K[2]) &
        0xffffffff;
      E = D;
      D = C;
      C = rotate_left(B, 30);
      B = A;
      A = temp;
    }

    for (i = 60; i < 80; i++) {
      temp = (rotate_left(A, 5) + (B ^ C ^ D) + E + W[i] + K[3]) & 0xffffffff;
      E = D;
      D = C;
      C = rotate_left(B, 30);
      B = A;
      A = temp;
    }

    H0 = (H0 + A) & 0xffffffff;
    H1 = (H1 + B) & 0xffffffff;
    H2 = (H2 + C) & 0xffffffff;
    H3 = (H3 + D) & 0xffffffff;
    H4 = (H4 + E) & 0xffffffff;
  }

  let result =
    cvt_hex(H0) + cvt_hex(H1) + cvt_hex(H2) + cvt_hex(H3) + cvt_hex(H4);
  return result.toLowerCase();
}

export function replaceSubstring(text:string, offset:number, length:number,replace:string) {
  const prefix = text.substring(0, offset);
  const suffix = text.substring(offset + length);
  return prefix + replace + suffix;

}


export const isEmailValid = (email:string)=>{
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function parseQueryFromUrl(urlStr: string): { url: URL; query: Record<string, string> } {
  const replacedUrl = urlStr.replace(/#/g, '?');
  const url = new URL(replacedUrl);
  const query = Array.from(url.searchParams.entries()).reduce(
    (acc, [key, value]) => ({
      ...acc,
      [key]: value,
    }),
    {}
  );

  return { url, query };
}


export function getCorsOptionsHeader(Access_Control_Allow_Origin: string = '*') {
  return {
    'Access-Control-Allow-Origin': Access_Control_Allow_Origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization, ApiKey, Token',
    'Access-Control-Allow-Credentials': 'true',
  };
}

export function getCorsHeader(
  Access_Control_Allow_Origin: string = '*',
  ContentType: string = 'application/json;charset=UTF-8'
) {
  return {
    'content-type': ContentType,
    'Access-Control-Allow-Origin': Access_Control_Allow_Origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };
}

export function ResponseJson(result: object, status = 200,Access_Control_Allow_Origin: string = '*') {
  return new Response(JSON.stringify(result), {
    status,
    headers: {
      ...getCorsHeader(Access_Control_Allow_Origin),
    },
  });
}

function downloadText(text:string, filename:string,type = "text/json") {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:'+type+';charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}


export function isPositiveInteger(str: string): boolean {
  const reg = /^[1-9]\d*$/; // 正则表达式
  return reg.test(str);
}

export function showBodyLoading(showLoading: boolean): void {
  const body = document.querySelector("body");
  if (showLoading) {
    body!.classList.add("loading_cursor");
  } else {
    body!.classList.remove("loading_cursor");
  }
}

export function downloadFromLink(name:string,url:string){
  let link = document.createElement('a');
  link.download = name; // set the image download name
  link.href = url; // set the data URL as the link URL
  document.body.appendChild(link); // add the link to the DOM
  link.click(); // click the link to trigger the download
  document.body.removeChild(link); // remove the link from the DOM
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

export function parseCallBackButtonPayload(data:string){
  const t  = data.split("/hex")
  if(t.length === 2){
    const params = JSON.parse(Buffer.from(t[1],'hex').toString())
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

export function encodeCallBackButtonPayload(data:string,payload?:any){
  if(payload){
    return `${data}/hex${Buffer.from(JSON.stringify(payload)).toString("hex")}`
  }else{
    return data
  }
}



export function getProxyConfigFromProxyConfStr(proxy?:string){
  if(!proxy){
    return null
  }
  let proxyType = "",proxyIp = "",proxyPort="",proxyUsername = "",proxyPassword="";
  let useProxy = !!proxy
  if(useProxy){
    if(proxy.split("://").length > 1){
      proxyType = proxy.split("://")[0]
      const proxyOther = proxy.split("://")[1]
      if(proxyOther.split("@").length > 1){
        proxyIp = proxyOther.split("@")[0].split(":")[0]
        proxyPort = proxyOther.split("@")[0].split(":")[1]
        proxyUsername = proxyOther.split("@")[1].split(":")[0]
        proxyPassword = proxyOther.split("@")[1].split(":")[1]
      }
    }
  }
  let proxyRules = `${proxyType}://${proxyIp}:${proxyPort}`;
  return  {
    proxyRules,
    proxyUsername,
    proxyPassword,
    proxyBypassRules: '<local>'
  };
}


/**
 * Sleeps a specified amount of time
 * @param ms time in milliseconds
 * @returns {Promise}
 */
export const sleep = (ms: number) =>
  new Promise(resolve => {
    setTimeout(resolve, ms);
  });
