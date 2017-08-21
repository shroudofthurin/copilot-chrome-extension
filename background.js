/**
 * Get the brand that corresponds with the hostname.
 *
 * @param {function(string)} hostname - called with the URL of the current tab
 *
 */
let brandsPromise;

function getBrandFromHostname(hostname) {
  if (!brandsPromise) {
    brandsPromise = fetchCopilotData('api/configs');
  }

  return new Promise(function (resolve, reject) {
    brandsPromise.then(function (brands) {
      let brand = brands.find(function(config) {
        let hostnames = config.hostnames || {};
        return hostname.indexOf(hostnames.consumer) > -1 || hostname.indexOf(hostnames.preview) > -1;
      });
      if (brand) {
        resolve(brand);
      } else {
        reject();
      }
    }).catch(err => {
      brandsPromise = false;
      reject(err);
    });
  });
}

/**
 * Search the API for piece of content using digitalData, if found save the URL and enable the browserAction
 * @param  {Object} tab         tab where digitalData refers to
 */
function findCopilotContent(tab) {
  let brand;
  let url = new URL(tab.url);

  let hostname = url.hostname;
  let pathname = url.pathname;
  let identifier = pathname.replace(/^\/*(.*?)\/*$/, '$1');

  getBrandFromHostname(hostname)
  .then(function (result) {
    brand = result;
    return authInstance();
  })
  .then(function (authObj) {
    // Check if user has access to brand
    if (authObj && authObj.brands.indexOf(brand.code) > -1) {
      return setBrandCookie(brand.code);
    }
    Promise.reject(new Error('User does not have access to brand'));
  })
  .then(searchCopilotByURI(encodeURIComponent(identifier)))
  .then(function(data) {
    if (data.hits.total === 1) {
      let hit = data.hits.hits[0];
      let url = `https://copilot.aws.conde.io/${brand.code}/${hit._source.meta.collectionName}/${hit._id}`;
      let storageData = {};
      storageData[`url${tab.id}`] = url;

      chrome.storage.sync.set(storageData, function() {
        chrome.browserAction.enable(tab.id);
        chrome.browserAction.setBadgeText({text: '', tabId: tab.id});
        chrome.browserAction.setTitle({title: 'Open in Copilot', tabId: tab.id});
      });
    }
  })
  .catch(function (err) {
    chrome.browserAction.setBadgeText({text: '!', tabId: tab.id});
    chrome.browserAction.setTitle({title: 'Error connecting to Copilot', tabId: tab.id});
  });
}

function fetchCopilotData(path) {
  return new Promise(function (resolve, reject) {
    fetch(`https://copilot.aws.conde.io/${path}`, {credentials: 'include', redirect: 'manual'})
    .then(status)
    .then(json)
    .then(resolve)
    .catch(reject);
  });
}

function status(response) {
  if (response.status >= 200 && response.status < 300 && response.redirected === false) {
    return Promise.resolve(response)
  } else {
    return Promise.reject(new Error(response.statusText))
  }
}

function json(response) {
  return response.json();
}

function setBrandCookie(brandCode) {
  return new Promise(function (resolve, reject) {
    let brandCookie = {
      url: 'https://copilot.aws.conde.io/api/search',
      name: 'brand',
      value: brandCode,
      expirationDate: (new Date().getTime()/1000) + 10
    };

    /* Set brand cookie to the current brand */
    chrome.cookies.set(brandCookie, function (cookie) {
      if (cookie) {
        resolve(cookie);
      } else {
        reject(new Error('Failed to set cookie'));
      }
    });
  });
}

function authInstance() {
  return fetchCopilotData('auth/instance');
}

function searchCopilotByURI(uri) {
  return function () {
    return fetchCopilotData(`api/search?view=edit&uri=${uri}`);
  }
}

/* Listen for the content-script to send digitalData if it exists */
chrome.runtime.onMessage.addListener(function (msg, sender) {
  findCopilotContent(sender.tab);
});

/* On Click - open the saved Copilot URL */
chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.storage.sync.get(`url${tab.id}`, function(value) {
    chrome.tabs.create({url: value[`url${tab.id}`]});
  });
});

/* Disable the browserAction on start */
chrome.browserAction.disable();
