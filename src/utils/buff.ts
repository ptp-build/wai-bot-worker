
function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(blob);
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
  });
}

export async function blobToBuffer(blob:Blob) {
  const ab = await blobToArrayBuffer(blob);
  return Buffer.from(ab)
}


export async function fileToArrayBuffer(file:File) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.onerror = () => {
      reject(reader.error);
    };
    reader.readAsArrayBuffer(file);
  });
}
export async function fileToBuffer(file:File) {
  return new Promise<Buffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // @ts-ignore
      const buffer = Buffer.from(reader.result);
      resolve(buffer);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
