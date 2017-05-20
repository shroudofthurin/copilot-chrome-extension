/* Format script content */
function formatDigitalData(digitalData) {
  let str = digitalData.replace('window.digitalData=', '');
  return str.substr(-1) === ';' ? str.substr(0, str.length-1) : str;
}

/* Listen for messages */
chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    /* If the received message has the expected format... */
    for (const a of document.querySelectorAll('script')) {
      if (a.textContent.includes('window.digitalData')) {
        let str = formatDigitalData(a.textContent);
        sendResponse(JSON.parse(str));
      }
    }
});
