
export const isEmailValid = (email:string)=>{
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function isPositiveInteger(str: string): boolean {
  const reg = /^[1-9]\d*$/; // 正则表达式
  return reg.test(str);
}
