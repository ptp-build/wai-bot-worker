
export const getErrorHtml = (
  {code,message,url,stack}:{code:string,message:string,url:string,stack:string},
  useProxy:boolean,
  {
    proxyRules,
    proxyUsername,
    proxyPassword
  }:{
    proxyRules:string,
    proxyUsername:string,
    proxyPassword:string
  })=>{
  console.log({code,message,url})
  console.log(stack)
  const proxy = !useProxy ? "" :`<div style='margin-top: 8px'>Proxy: ${proxyRules} : ${proxyUsername} /  ${proxyPassword}</div>`
  return `<!DOCTYPE html>
<html lang='en'>
<head>
  <meta charset='UTF-8'>
  <title>Error</title>
  <script>
  function reload(){
    window.invoke_api("Load_url",{url:"${url}"})
  }
</script>
</head>
<body>
<div id="message" style='width: 100%;height:100vh;display: flex; flex-direction:column;align-items: center;justify-content: center'>
  <h2 style='word-break:break-word'>${code}</h2>
  ${proxy}
  <div style='margin-top: 16px'>${message}</div>
  <button style='margin-top: 32px' onclick='reload()'>Retry</button>
</div>
</body>
</html>
`
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
  const t  = data.split("/")
  const payload = t[t.length - 1]
  return JSON.parse(Buffer.from(payload,'hex').toString())
}

export function encodeCallBackButtonPayload(data:string,payload:any){
  return `${data}/${Buffer.from(JSON.stringify(payload)).toString("hex")}`
}
