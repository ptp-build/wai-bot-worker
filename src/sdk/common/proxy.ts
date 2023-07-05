
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
