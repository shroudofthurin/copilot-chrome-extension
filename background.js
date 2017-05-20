/**
 * Get the brand that corresponds with the hostname.
 *
 * @param {function(string)} hostname - called with the URL of the current tab
 *
 */
function getBrandFromHostname(hostname) {
  let brands = [
    {name: 'Allure', abbv: 'all', host: 'www.allure.com'},
    {name: 'Architecturl Digest', abbv: 'ad', host: 'www.architecturaldigest.com'},
    {name: 'Bon Appétit', abbv: 'bon', host: 'www.bonappetit.com'},
    {name: 'Brides', abbv: 'brides', host: 'www.brides.com'},
    {name: 'CN Trending', abbv: 'snd', host: 'www.cntrending.com'},
    {name: 'Conde Nast Traveler', abbv: 'cnt', host: 'www.cntraveler.com'},
    {name: 'Details', abbv: 'det', host: 'www.details.com'},
    {name: 'Engineering', abbv: 'engineering', host: 'engineering.condenast.io'},
    {name: 'Epicurious', abbv: 'epi', host: 'www.epicurious.com'},
    {name: 'Glamour', abbv: 'glm', host: 'www.glamour.com'},
    {name: 'Golf Digest', abbv: 'gd', host: 'www.golfdigest.com'},
    {name: 'GQ', abbv: 'gq', host: 'www.gq.com'},
    {name: 'Pitchfork', abbv: 'p4k', host: 'www.pitchfork.com'},
    {name: 'Self', abbv: 'self', host: 'www.self.com'},
    {name: 'Teen Vogue', abbv: 'tnv', host: 'www.teenvogue.com'},
    {name: 'The New Yorker', abbv: 'tny', host: 'www.newyorker.com'},
    {name: 'Vanity Fair', abbv: 'vf', host: 'www.vanityfair.com'},
    {name: 'Vogue', abbv: 'vogue', host: 'www.vogue.com'},
    {name: 'Vogue Germany', abbv: 'vde', host: 'www.vogue.de'},
    {name: 'W Magazine', abbv: 'wmag', host: 'www.wmagazine.com'},
    {name: 'Wired', abbv: 'wrd', host: 'www.wired.com'}
  ];
  return brands.find(function(brand) { return brand.host === hostname });
}

/**
 * Get the brand api.
 *
 * @param {function(hash)} brand - called with the brand hash
 *
 */
function getBrandAPI(brand) {
  let searchHost;
  switch (brand.abbv) {
    case 'det':
      searchHost = 'details-api.aws.conde.io';
      break;
    case 'vf':
      searchHost = 'vf-api.aws.conde.io/v2';
      break;
    case 'bon':
      searchHost = 'bonappetit-api.aws.conde.io/';
      break;
    case 'p4k':
      searchHost = 'pitchfork-api.aws.conde.io/';
      break;
    default:
      searchHost = brand.abbv + '-api.aws.conde.io';
  }
  return 'https://' + searchHost;
}

function status(response) {
  if (response.status >= 200 && response.status < 300) {
    return Promise.resolve(response)
  } else {
    return Promise.reject(new Error(response.statusText))
  }
}

function json(response) {
  return response.json()
}

function pluralizeType(type) {
  let specialTypes = {
    gallery: 'galleries'
  };
  return specialTypes[type] || type + 's';
}

/* A function creator for callbacks */
function openContentFormInCopilot(digitalData) {
  if (digitalData) {
    chrome.tabs.query({'active': true, currentWindow: true}, function(tabs) {
      let url = tabs[0].url;
      let id  = digitalData.contentID;

      let hostname = new URL(url).hostname;
      let brand    = getBrandFromHostname(hostname);
      let brandAPI = getBrandAPI(brand);

      let searchURL = `${brandAPI}/search?id=${id}`;
      let baseURL = 'https://copilot.aws.conde.io';


      fetch(searchURL)
        .then(status)
        .then(json)
        .then(function(data) {
          if (data.hits.total) {
            let hit = data.hits.hits[0];
            let url = `${baseURL}/${brand.abbv}/${pluralizeType(hit._type)}/${hit._id}`;

            chrome.tabs.create({url: url});
          }
        }).catch(function(error) {
          console.log('Request failed', error);
        });
    });
  }
}

chrome.browserAction.onClicked.addListener(function(tab) {
  if (tab) {
    /* ...if it matches, send a message specifying a callback too */
    chrome.tabs.sendMessage(tab.id, { text: "report_back" }, openContentFormInCopilot);
  }

});
