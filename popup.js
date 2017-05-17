/**
 * Get the current URL.
 *
 * @param {function(string)} callback - called when the URL of the current tab
 *   is found.
 */
function getCurrentTabUrl(callback) {
  // Query filter to be passed to chrome.tabs.query - see
  // https://developer.chrome.com/extensions/tabs#method-query
  let queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, function(tabs) {
    let tab = tabs[0];
    let url = tab.url;
    console.assert(typeof url == 'string', 'tab.url should be a string');
    callback(url);
  });
}

function renderStatus(statusText) {
  document.getElementById('status').textContent = statusText;
}

function pluralizeType(type) {
  let specialTypes = {
    gallery: 'galleries'
  };
  return specialTypes[type] || type + 's';
}

function CopilotFinder() {
  this.brands = [
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

  this.brand  = null;
  this.tabURL = null;
  this.searchHost = null;
  this.copilotURL = null;
  this.baseQuery  = '/search?size=1&view=edit&nottypes=cnevideos&uri=';

  this.setBrand = function() {
    let hostname = new URL(this.tabURL).hostname;
    let brand  = this.brands.find(function(brand) { return brand.host === hostname });
    this.brand = brand;
    return brand;
  };

  this.setSearchHost = function() {
    let searchHost;
    switch (this.brand.abbv) {
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
        searchHost = this.brand.abbv + '-api.aws.conde.io';
    }
    this.searchHost = 'http://' + searchHost;
  };

  /**
   * @param {string} url - Url of copilot backed application (e.g. a gq.com url)
   * @param {function(string)} callback - Called when a Copilot Editor URL
   *   been found. The callback gets the URL.
   * @param {function(string)} errorCallback - Called when copilot url is not
   *   found.  The callback gets a string that describes the failure reason.
   */
  this.getCopilotUrl = function (callback, errorCallback) {
    let tabURL = this.tabURL;
    let brand  = this.setBrand();

    if (brand) {
      this.setSearchHost();

      let x = new XMLHttpRequest();
      let pathname = new URL(tabURL).pathname;
      let path = pathname.slice(1, pathname.length);
      let searchUrl = this.searchHost
        + this.baseQuery
        + encodeURIComponent(path);

      x.open('GET', searchUrl);
      x.responseType = 'json';
      x.timeout = 3000;
      x.onload = function() {
        let response = x.response;

        if(response.hits.total){
          let hit  = response.hits.hits[0];
          let type = pluralizeType(hit._type);
          let baseUrl = 'https://copilot.aws.conde.io/'
          let copilotUrl = baseUrl + brand.abbv + '/' + type + '/' + hit._id;
          callback(copilotUrl);
        } else {
          errorCallback('No response from Copilot API.');
          return;
        }
      };
      x.onerror = function() {
        errorCallback('Network error.');
      };
      x.ontimeout = function() {
        renderStatus('Request timed out. Are you sure you\'re on the Conde Nast VPN?');
      }
      x.send();
    } else {
      renderStatus('Not a Copilot Brand Site');
    }
  }

  this.handleTabURL = function() {
    this.getCopilotUrl(function(copilotUrl) {
      this.copilotURL = copilotUrl;
      renderStatus('Found Copilot ' + this.brand.name + ' URL:');
      let link = document.createElement('a');
      link.setAttribute('href', '#');
      link.textContent = 'Open in New Tab';
      link.onclick = openInNewTab;
      document.getElementById('link').appendChild(link);
    }.bind(this), function(errorMessage) {
      renderStatus('Cannot access copilot url: ' + errorMessage);
    });
  }

  this.fetchUrl = function() {
    getCurrentTabUrl(function(url) {
      this.tabURL = url;
      this.handleTabURL();
    }.bind(this));
  };
}

function openInNewTab() {
  let brandCookie = chrome.cookies.get({
    name: 'brand',
    url: 'https://copilot.aws.conde.io'
  }, function (cookie) {
    let cookieOptions = {
      name: 'brand',
      url: 'https://copilot.aws.conde.io',
      value: copilotFinder.brand.abbv,
      path: cookie.path,
      httpOnly: cookie.httpOnly
    };
    chrome.cookies.set(cookieOptions, function(setCookie) {
      chrome.tabs.create({ url: copilotFinder.copilotURL });
    });
  });
}

let copilotFinder = new CopilotFinder;

document.addEventListener('DOMContentLoaded', function() {
  copilotFinder.fetchUrl();
});
