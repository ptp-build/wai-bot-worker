
function downloadText(text:string, filename:string,type = "text/json") {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:'+type+';charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

export function downloadFromLink(name:string,url:string){
  let link = document.createElement('a');
  link.download = name; // set the image download name
  link.href = url; // set the data URL as the link URL
  document.body.appendChild(link); // add the link to the DOM
  link.click(); // click the link to trigger the download
  document.body.removeChild(link); // remove the link from the DOM
}

export function showBodyLoading(showLoading: boolean): void {
  const body = document.querySelector("body");
  if (showLoading) {
    body!.classList.add("loading_cursor");
  } else {
    body!.classList.remove("loading_cursor");
  }
}
