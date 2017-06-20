let digitalData;

var script = document.createElement('script');
script.textContent = String.raw`setTimeout(function () { 
  var event = document.createEvent("CustomEvent");  
  event.initCustomEvent("cpScriptLoaded", true, true, {"digitalData": digitalData});
  window.dispatchEvent(event);
}, 500);`;

(document.head || document.documentElement).appendChild(script);

window.addEventListener("cpScriptLoaded", function (e) {
  digitalData = e.detail.digitalData;
  chrome.runtime.sendMessage({ digitalData: digitalData });
});
