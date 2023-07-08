
export async function arrayBufferToBase64(arrayBuffer:ArrayBuffer,type?:string) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([arrayBuffer],{type});
    const reader = new FileReader();

    reader.onloadend = () => {
      resolve(reader.result);
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsDataURL(blob);
  });
}

export function arrayBufferToHex(arrayBuffer:ArrayBuffer):Promise<string> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([arrayBuffer]);
    const reader = new FileReader();

    reader.onloadend = () => {
      const dataView = new DataView(<ArrayBuffer>reader.result);
      let hexString = '';

      for (let i = 0; i < dataView.byteLength; i++) {
        const hex = dataView.getUint8(i).toString(16).padStart(2, '0');
        hexString += hex;
      }

      resolve(hexString);
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsArrayBuffer(blob);
  });
}


function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(blob);
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
  });
}

function blobToDateUri(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = () => resolve(reader.result as string);
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

export async function fileToBase64(file:File) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.onerror = () => {
      reject(reader.error);
    };
    reader.readAsDataURL(file);
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

export function dataURItoBuffer(dataURI:string) {
  // Extract the Base64 data from the data URI
  const base64 = dataURI.split(',')[1];

  // Extract the media type from the data URI
  //@ts-ignore
  const mimeType = dataURI.match(/^data:(.*?);/)[1];

  // Convert Base64 to binary string
  const binaryString = window.atob(base64);

  // Create an ArrayBuffer
  const buffer = new ArrayBuffer(binaryString.length);

  // Create a typed array to represent the buffer
  const bufferView = new Uint8Array(buffer);

  // Fill the buffer view with the binary data
  for (let i = 0; i < binaryString.length; i++) {
    bufferView[i] = binaryString.charCodeAt(i);
  }

  return {
    buffer: buffer,
    mimeType: mimeType
  };
}
