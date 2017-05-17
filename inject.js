/* Listen for messages */
chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    /* If the received message has the expected format... */
    for (const a of document.querySelectorAll('script')) {
      if (a.textContent.includes('window.digitalData')) {
        let str = a.textContent.replace('window.digitalData=', '');
        sendResponse(JSON.parse(str.substr(0, str.length-1)));
      }
    }
});
