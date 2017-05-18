
/* A function creator for callbacks */
function openContentFormInCopilot(digitalData) {
  if (digitalData) {
    let id   = digitalData.contentID;
    let type = digitalData.pageType;
    let brands = [
      {name: 'Allure', abbv: 'all'},
      {name: 'Architecturl Digest', abbv: 'ad'},
      {name: 'Bon Appétit', abbv: 'bon'},
      {name: 'Brides', abbv: 'brides'},
      {name: 'CN Trending', abbv: 'snd'},
      {name: 'Conde Nast Traveler', abbv: 'cnt'},
      {name: 'Details', abbv: 'det'},
      {name: 'Engineering', abbv: 'engineering'},
      {name: 'Epicurious', abbv: 'epi'},
      {name: 'Glamour', abbv: 'glm'},
      {name: 'Golf Digest', abbv: 'gd'},
      {name: 'GQ', abbv: 'gq'},
      {name: 'Pitchfork', abbv: 'p4k'},
      {name: 'Self', abbv: 'self'},
      {name: 'Teen Vogue', abbv: 'tnv'},
      {name: 'The New Yorker', abbv: 'tny'},
      {name: 'Vanity Fair', abbv: 'vf'},
      {name: 'Vogue', abbv: 'vogue'},
      {name: 'Vogue Germany', abbv: 'vde'},
      {name: 'W Magazine', abbv: 'wmag'},
      {name: 'Wired', abbv: 'wrd'}
    ];
    let brand = brands.find(function(brand) { return brand.name === digitalData.brand });
    let copilotUrl = `https://copilot.aws.conde.io/${brand.abbv}/${type}/${id}`;

    chrome.tabs.create({url: copilotUrl});
  }
}

chrome.browserAction.onClicked.addListener(function(tab) {
  if (tab) {
    /* ...if it matches, send a message specifying a callback too */
    chrome.tabs.sendMessage(tab.id, { text: "report_back" }, openContentFormInCopilot);
  }

});
