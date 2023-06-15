"use strict";(self.webpackChunkwai=self.webpackChunkwai||[]).push([[3748],{3748:(t,e,s)=>{s.r(e),s.d(e,{default:()=>x});var i=s(77361),r=s(74095),a=s(9933),n=s(3570),o=s(69118);function h(t,e,s){return(e=function(t){var e=function(t,e){if("object"!=typeof t||null===t)return t;var s=t[Symbol.toPrimitive];if(void 0!==s){var i=s.call(t,"string");if("object"!=typeof i)return i;throw new TypeError("@@toPrimitive must return a primitive value.")}return String(t)}(t);return"symbol"==typeof e?e:String(e)}(e))in t?Object.defineProperty(t,e,{value:s,enumerable:!0,configurable:!0,writable:!0}):t[e]=s,t}const d=Symbol("WAITING"),c=i.wZ||i.cj?.75:1,m=i.wZ?.5:.75,l=24,u=i.s$?2:4,p=new Map,g=new Array(4).fill(void 0).map((()=>(0,r.K)(new Worker(new URL(s.p+s.u(289),s.b)))));let f=-1;class y{static init(...t){const[e,s,i,r,,a]=t;let n=p.get(r);return n?n.addContainer(e,s,i,a?.coords):(n=new y(...t),p.set(r,n)),n}constructor(t,e,s,i,r,a={},n,o,d){this.id=i,this.tgsUrl=r,this.params=a,this.customColor=n,this.onEnded=o,this.onLoop=d,h(this,"containers",new Map),h(this,"imgSize",void 0),h(this,"imageData",void 0),h(this,"msPerFrame",1e3/60),h(this,"reduceFactor",1),h(this,"cacheModulo",void 0),h(this,"workerIndex",void 0),h(this,"frames",[]),h(this,"framesCount",void 0),h(this,"isAnimating",!1),h(this,"isWaiting",!0),h(this,"isEnded",!1),h(this,"isDestroyed",!1),h(this,"isRendererInited",!1),h(this,"approxFrameIndex",0),h(this,"prevFrameIndex",-1),h(this,"stopFrameIndex",0),h(this,"speed",1),h(this,"direction",1),h(this,"lastRenderAt",void 0),this.addContainer(t,e,s,a.coords),this.initConfig(),this.initRenderer()}removeContainer(t){const{canvas:e,ctx:s,isSharedCanvas:i,coords:r}=this.containers.get(t);i?s.clearRect(r.x,r.y,this.imgSize,this.imgSize):e.remove(),this.containers.delete(t),this.containers.size||this.destroy()}isPlaying(){return this.isAnimating||this.isWaiting}play(t=!1,e){e&&(this.containers.get(e).isPaused=!1),this.isEnded&&t&&(this.approxFrameIndex=Math.floor(0)),this.stopFrameIndex=void 0,this.direction=1,this.doPlay()}pause(t){t&&(this.containers.get(t).isPaused=!0,!Array.from(this.containers.values()).every((({isPaused:t})=>t)))||(this.isWaiting?this.stopFrameIndex=this.approxFrameIndex:this.isAnimating=!1,this.params.isLowPriority||(this.frames=this.frames.map(((t,e)=>e===this.prevFrameIndex?t:void(t&&t!==d&&t.close())))))}playSegment([t,e]){this.approxFrameIndex=Math.floor(t/this.reduceFactor),this.stopFrameIndex=Math.floor(e/this.reduceFactor),this.direction=t<e?1:-1,this.doPlay()}setSpeed(t){this.speed=t}setNoLoop(t){this.params.noLoop=t}setSharedCanvasCoords(t,e){const s=this.containers.get(t),{canvas:i,ctx:r}=s;if(!i.dataset.isJustCleaned||"false"===i.dataset.isJustCleaned){const t=this.calcSizeFactor();v(i,t),r.clearRect(0,0,i.width,i.height),i.dataset.isJustCleaned="true",(0,o.T2)((()=>{i.dataset.isJustCleaned="false"}))}s.coords={x:Math.round((e?.x||0)*i.width),y:Math.round((e?.y||0)*i.height)};const a=this.getFrame(this.prevFrameIndex)||this.getFrame(Math.round(this.approxFrameIndex));a&&a!==d&&r.drawImage(a,s.coords.x,s.coords.y)}addContainer(t,e,s,i){const r=this.calcSizeFactor();let a;if(e instanceof HTMLDivElement){if(!(e.parentNode instanceof HTMLElement))throw new Error("[RLottie] Container is not mounted");let{size:i}=this.params;if(!i&&(i=e.offsetWidth||parseInt(e.style.width,10)||e.parentNode.offsetWidth,!i))throw new Error("[RLottie] Failed to detect width from container");const n=document.createElement("canvas"),o=n.getContext("2d");n.style.width=`${i}px`,n.style.height=`${i}px`,a=Math.round(i*r),n.width=a,n.height=a,e.appendChild(n),this.containers.set(t,{canvas:n,ctx:o,onLoad:s})}else{if(!e.isConnected)throw new Error("[RLottie] Shared canvas is not mounted");const n=e,o=n.getContext("2d");v(n,r),a=Math.round(this.params.size*r),this.containers.set(t,{canvas:n,ctx:o,isSharedCanvas:!0,coords:{x:Math.round((i?.x||0)*n.width),y:Math.round((i?.y||0)*n.height)},onLoad:s})}this.imgSize||(this.imgSize=a,this.imageData=new ImageData(a,a)),this.isRendererInited&&this.doPlay()}calcSizeFactor(){const{isLowPriority:t,size:e,quality:s=(t&&(!e||e>l)?m:c)}=this.params;return Math.max(i.cL*s,1)}destroy(){this.isDestroyed=!0,this.pause(),this.clearCache(),this.destroyRenderer(),p.delete(this.id)}clearCache(){this.frames.forEach((t=>{t&&t!==d&&t.close()})),this.imageData=void 0,this.frames=[]}initConfig(){const{isLowPriority:t}=this.params;this.cacheModulo=t?0:u}setColor(t){this.customColor=t}initRenderer(){this.workerIndex=(0,n.Z)(4,++f),g[this.workerIndex].request({name:"init",args:[this.id,this.tgsUrl,this.imgSize,this.params.isLowPriority||!1,this.customColor,this.onRendererInit.bind(this)]})}destroyRenderer(){g[this.workerIndex].request({name:"destroy",args:[this.id]})}onRendererInit(t,e,s){this.isRendererInited=!0,this.reduceFactor=t,this.msPerFrame=e,this.framesCount=s,this.isWaiting&&this.doPlay()}changeData(t){this.pause(),this.tgsUrl=t,this.initConfig(),g[this.workerIndex].request({name:"changeData",args:[this.id,this.tgsUrl,this.params.isLowPriority||!1,this.onChangeData.bind(this)]})}onChangeData(t,e,s){this.reduceFactor=t,this.msPerFrame=e,this.framesCount=s,this.isWaiting=!1,this.isAnimating=!1,this.doPlay()}doPlay(){this.framesCount&&(this.isDestroyed||this.isAnimating||(this.isWaiting||(this.lastRenderAt=void 0),this.isEnded=!1,this.isAnimating=!0,this.isWaiting=!1,(0,a.jt)((()=>{if(this.isDestroyed)return!1;if(!this.isAnimating&&Array.from(this.containers.values()).every((({isLoaded:t})=>t)))return!1;const t=Math.round(this.approxFrameIndex),e=this.getFrame(t);if(!e||e===d)return e||this.requestFrame(t),this.isAnimating=!1,this.isWaiting=!0,!1;this.cacheModulo&&t%this.cacheModulo==0&&this.cleanupPrevFrame(t),t!==this.prevFrameIndex&&(this.containers.forEach((t=>{const{ctx:s,isLoaded:i,isPaused:r,coords:{x:a,y:n}={},onLoad:o}=t;i&&r||(s.clearRect(a||0,n||0,this.imgSize,this.imgSize),s.drawImage(e,a||0,n||0)),i||(t.isLoaded=!0,o?.())})),this.prevFrameIndex=t);const s=Date.now(),i=this.lastRenderAt?this.msPerFrame/(s-this.lastRenderAt):1,r=Math.min(1,this.direction*this.speed/i),a=Math.round(this.approxFrameIndex+r);if(this.lastRenderAt=s,r>0&&(t===this.framesCount-1||a>this.framesCount-1)){if(this.params.noLoop)return this.isAnimating=!1,this.isEnded=!0,this.onEnded?.(),!1;this.onLoop?.(),this.approxFrameIndex=0}else if(r<0&&(0===t||a<0)){if(this.params.noLoop)return this.isAnimating=!1,this.isEnded=!0,this.onEnded?.(),!1;this.onLoop?.(),this.approxFrameIndex=this.framesCount-1}else{if(void 0!==this.stopFrameIndex&&(t===this.stopFrameIndex||r>0&&a>this.stopFrameIndex||r<0&&a<this.stopFrameIndex))return this.stopFrameIndex=void 0,this.isAnimating=!1,!1;this.approxFrameIndex+=r}const n=Math.round(this.approxFrameIndex);return!!this.getFrame(n)||(this.requestFrame(n),this.isWaiting=!0,this.isAnimating=!1,!1)}))))}getFrame(t){return this.frames[t]}requestFrame(t){this.frames[t]=d,g[this.workerIndex].request({name:"renderFrames",args:[this.id,t,this.onFrameLoad.bind(this)]})}cleanupPrevFrame(t){if(this.framesCount<3)return;const e=(0,n.Z)(this.framesCount,t-1);this.frames[e]=void 0}onFrameLoad(t,e){this.frames[t]===d&&(this.frames[t]=e,this.isWaiting&&this.doPlay())}}function v(t,e){const s=Math.round(t.offsetWidth*e),i=Math.round(t.offsetHeight*e);t.width===s&&t.height===i||(t.width=s,t.height=i)}const x=y},74095:(t,e,s)=>{s.d(e,{K:()=>n});var i=s(26926);function r(t,e,s){return(e=function(t){var e=function(t,e){if("object"!=typeof t||null===t)return t;var s=t[Symbol.toPrimitive];if(void 0!==s){var i=s.call(t,"string");if("object"!=typeof i)return i;throw new TypeError("@@toPrimitive must return a primitive value.")}return String(t)}(t);return"symbol"==typeof e?e:String(e)}(e))in t?Object.defineProperty(t,e,{value:s,enumerable:!0,configurable:!0,writable:!0}):t[e]=s,t}class a{constructor(t,e,s){this.target=t,this.onUpdate=e,this.channel=s,r(this,"requestStates",new Map),r(this,"requestStatesByCallback",new Map)}destroy(){}init(...t){this.postMessage({type:"init",args:t})}request(t){const{requestStates:e,requestStatesByCallback:s}=this,r=(0,i.Z)(e),a={type:"callMethod",messageId:r,...t},n={messageId:r},o=new Promise(((t,e)=>{Object.assign(n,{resolve:t,reject:e})}));if("function"==typeof a.args[a.args.length-1]){a.withCallback=!0;const t=a.args.pop();n.callback=t,s.set(t,n)}return e.set(r,n),o.catch((()=>{})).finally((()=>{e.delete(r),n.callback&&s.delete(n.callback)})),this.postMessage(a),o}cancelCallback(t){t.isCanceled=!0;const{messageId:e}=this.requestStatesByCallback.get(t)||{};e&&this.postMessage({type:"cancelProgress",messageId:e})}onMessage(t){const{requestStates:e,channel:s}=this;if(t.channel===s)if("update"===t.type&&this.onUpdate&&this.onUpdate(t.update),"methodResponse"===t.type){const s=e.get(t.messageId);s&&(t.error?s.reject(t.error):s.resolve(t.response))}else if("methodCallback"===t.type){const s=e.get(t.messageId);s?.callback?.(...t.callbackArgs)}else if("unhandledError"===t.type)throw new Error(t.error?.message)}postMessage(t){t.channel=this.channel,this.target.postMessage(t)}}function n(t,e,s){const i=new a(t,e,s);function r({data:t}){i.onMessage(t)}return t.addEventListener("message",r),i.destroy=()=>{t.removeEventListener("message",r)},i}},3570:(t,e,s)=>{function i(t,e){return e-Math.floor(e/t)*t}s.d(e,{Z:()=>i})}}]);
//# sourceMappingURL=3748.8d8e9d2918137477431d.js.map