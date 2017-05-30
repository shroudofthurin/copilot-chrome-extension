/* Format script content */
function formatDigitalData(data) {
  let str = data.replace(/\s/g, '').match(/{".*"}/i)[0];
  return JSON.parse(str);
}

/* Listen for messages */
chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    /* If the received message has the expected format... */
    for (const a of document.querySelectorAll('script')) {
      if (a.textContent.includes('var digitalData')) {
        let data = a.textContent.replace('var digitalData = ', '');

        sendResponse(formatDigitalData(data));
      } else if (a.textContent.includes('window.digitalData')) {
        let data = a.textContent.replace('window.digitalData=', '');

        sendResponse(formatDigitalData(data));
      }
    }
});
