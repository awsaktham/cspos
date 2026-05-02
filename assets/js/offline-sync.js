(function () {
  'use strict';

  if (window.CSPSR_OFFLINE_SYNC_READY) return;
  window.CSPSR_OFFLINE_SYNC_READY = true;

  var STORAGE_QUEUE = 'cspsr_offline_queue_v1';
  var STORAGE_CACHE = 'cspsr_offline_cache_v1';
  var STORAGE_META = 'cspsr_offline_meta_v1';
  var root = ((window.CSPSR_CONFIG && window.CSPSR_CONFIG.root) || '/wp-json/cspsr/v1/').replace(/\/$/, '') + '/';
  var originalFetch = window.fetch ? window.fetch.bind(window) : null;
  if (!originalFetch) return;

  function nowIso() { return new Date().toISOString(); }
  function safeJsonParse(raw, fallback) {
    if (!raw) return fallback;
    try { return JSON.parse(raw); } catch (e) { return fallback; }
  }
  function loadQueue() { return safeJsonParse(localStorage.getItem(STORAGE_QUEUE), []); }
  function saveQueue(queue) { localStorage.setItem(STORAGE_QUEUE, JSON.stringify(queue)); }
  function loadCache() { return safeJsonParse(localStorage.getItem(STORAGE_CACHE), {}); }
  function saveCache(cache) { localStorage.setItem(STORAGE_CACHE, JSON.stringify(cache)); }
  function loadMeta() { return safeJsonParse(localStorage.getItem(STORAGE_META), { pending: 0, syncing: false, offline: !navigator.onLine, lastSyncAt: null, lastError: '' }); }
  function saveMeta(meta) { localStorage.setItem(STORAGE_META, JSON.stringify(meta)); }

  function makeResponse(data, status) {
    return Promise.resolve(new Response(JSON.stringify(data), {
      status: status || 200,
      headers: { 'Content-Type': 'application/json' }
    }));
  }

  function notifyState() {
    var meta = loadMeta();
    window.dispatchEvent(new CustomEvent('cspsr-offline-state', { detail: meta }));
  }

  function setMeta(patch) {
    var meta = loadMeta();
    var next = Object.assign({}, meta, patch || {});
    if (typeof next.pending !== 'number') next.pending = loadQueue().length;
    saveMeta(next);
    notifyState();
    return next;
  }

  function normalizeUrl(url) {
    if (!url) return null;
    if (typeof url !== 'string') url = String(url.url || url);
    if (url.indexOf(root) !== 0) return null;
    return url
      .slice(root.length)
      .replace(/^\//, '')
      .replace(/[?#].*$/, '');
  }

  function cloneData(data) {
    return data == null ? data : JSON.parse(JSON.stringify(data));
  }

  function readJsonBody(opts) {
    if (!opts || !opts.body) return null;
    try { return JSON.parse(opts.body); } catch (e) { return null; }
  }

  function cacheGet(path, data) {
    var cache = loadCache();
    cache[path] = { data: cloneData(data), updatedAt: nowIso() };
    saveCache(cache);
  }

  function readCached(path) {
    var cache = loadCache();
    return cache[path] ? cloneData(cache[path].data) : null;
  }

  function getCollectionName(path) {
    if (path.indexOf('/') === -1) return path;
    if (/^customers\/\d+\/contacts$/.test(path)) return 'contacts';
    if (/^customers\/\d+\/recipients$/.test(path)) return 'recipients';
    return null;
  }

  function ensureArray(val) { return Array.isArray(val) ? val : []; }
  function tempId(prefix) { return prefix + '-tmp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8); }

  function updateBootstrapList(name, updater) {
    var bootstrap = readCached('bootstrap');
    if (!bootstrap) return;
    bootstrap[name] = updater(ensureArray(bootstrap[name]));
    cacheGet('bootstrap', bootstrap);
  }

  function upsertById(list, item) {
    var next = ensureArray(list).slice();
    var found = false;
    next = next.map(function (row) {
      if (String(row.id) === String(item.id)) {
        found = true;
        return Object.assign({}, row, item);
      }
      return row;
    });
    if (!found) next.unshift(item);
    return next;
  }

  function removeById(list, id) {
    return ensureArray(list).filter(function (row) { return String(row.id) !== String(id); });
  }

  function patchCachedData(path, method, body) {
    var collection = getCollectionName(path);
    var itemMatch = path.match(/^([a-z-]+)\/([^/]+)$/);
    var nestedContacts = path.match(/^customers\/(\d+)\/contacts$/);
    var nestedRecipients = path.match(/^customers\/(\d+)\/recipients$/);
    var bootstrap = readCached('bootstrap');

    if (method === 'POST' && collection && body) {
      var newItem = Object.assign({}, body);
      if (newItem.id == null) newItem.id = tempId(collection);
      var existing = readCached(path);
      cacheGet(path, [newItem].concat(ensureArray(existing)));
      if (collection === 'customers' || collection === 'products' || collection === 'suppliers' || collection === 'roles' || collection === 'departments' || collection === 'teams' || collection === 'employees' || collection === 'statuses' || collection === 'notifications') {
        updateBootstrapList(collection, function (list) { return [newItem].concat(ensureArray(list)); });
      }
      if (nestedContacts) {
        var customerId = nestedContacts[1];
        updateBootstrapList('customers', function (list) {
          return ensureArray(list).map(function (customer) {
            if (String(customer.id) !== String(customerId)) return customer;
            var contacts = ensureArray(customer.contacts);
            return Object.assign({}, customer, { contacts: [newItem].concat(contacts) });
          });
        });
      }
      if (nestedRecipients) {
        var recipientCustomerId = nestedRecipients[1];
        updateBootstrapList('customers', function (list) {
          return ensureArray(list).map(function (customer) {
            if (String(customer.id) !== String(recipientCustomerId)) return customer;
            var recipients = ensureArray(customer.recipients);
            return Object.assign({}, customer, { recipients: [newItem].concat(recipients) });
          });
        });
      }
      if (path === 'orders') {
        updateBootstrapList('orders', function (list) { return [newItem].concat(ensureArray(list)); });
      }
      if (path === 'setup') {
        cacheGet('setup', Object.assign({}, readCached('setup') || {}, body));
        if (bootstrap) {
          bootstrap.setup = Object.assign({}, bootstrap.setup || {}, body);
          cacheGet('bootstrap', bootstrap);
        }
      }
      return;
    }

    if (itemMatch && method === 'PUT' && body) {
      var collectionName = itemMatch[1];
      var itemId = itemMatch[2];
      var currentItem = readCached(path) || {};
      var merged = Object.assign({}, currentItem, body, { id: currentItem.id || itemId });
      cacheGet(path, merged);
      updateBootstrapList(collectionName, function (list) { return upsertById(list, merged); });
      return;
    }

    if (itemMatch && method === 'DELETE') {
      var deleteCollection = itemMatch[1];
      var deleteId = itemMatch[2];
      updateBootstrapList(deleteCollection, function (list) { return removeById(list, deleteId); });
      return;
    }

    if (method === 'PUT' && /^(contacts|recipients)\/([^/]+)$/.test(path) && body) {
      var existingNested = readCached(path) || {};
      cacheGet(path, Object.assign({}, existingNested, body));
      return;
    }
  }

  function queueRequest(path, method, opts) {
    var queue = loadQueue();
    var item = {
      id: tempId('queue'),
      path: path,
      method: method,
      body: readJsonBody(opts),
      headers: (opts && opts.headers) || {},
      createdAt: nowIso()
    };
    queue.push(item);
    saveQueue(queue);
    patchCachedData(path, method, item.body);
    setMeta({ pending: queue.length, offline: true, lastError: '' });
    return item;
  }

  function buildOptimisticPayload(path, method, queued) {
    if (method === 'POST') {
      return queued.body && typeof queued.body === 'object'
        ? Object.assign({ queued: true, offline: true, id: queued.body.id || queued.id }, queued.body)
        : { queued: true, offline: true, id: queued.id };
    }
    if (method === 'DELETE') return { deleted: true, queued: true, offline: true };
    return Object.assign({ updated: true, queued: true, offline: true }, queued.body || {});
  }

  function maybeServeFromCache(path) {
    var cached = readCached(path);
    if (cached != null) return makeResponse(cached, 200);
    if (path !== 'bootstrap') {
      var bootstrap = readCached('bootstrap');
      if (bootstrap && bootstrap[path] != null) return makeResponse(bootstrap[path], 200);
    }
    return null;
  }

  function cacheSuccessfulGet(path, response) {
    return response.clone().json().then(function (data) {
      cacheGet(path, data);
      if (path === 'setup') {
        var bootstrap = readCached('bootstrap');
        if (bootstrap) {
          bootstrap.setup = data;
          cacheGet('bootstrap', bootstrap);
        }
      }
      return response;
    }).catch(function () {
      return response;
    });
  }

  function replayQueue() {
    if (!navigator.onLine) return Promise.resolve(false);
    var queue = loadQueue();
    if (!queue.length) {
      setMeta({ pending: 0, syncing: false, offline: false, lastError: '' });
      return Promise.resolve(true);
    }
    setMeta({ syncing: true, offline: false, pending: queue.length, lastError: '' });

    var sequence = Promise.resolve();
    var failures = [];

    queue.forEach(function (entry) {
      sequence = sequence.then(function () {
        return originalFetch(root + entry.path, {
          method: entry.method,
          headers: Object.assign({ 'Content-Type': 'application/json' }, entry.headers || {}),
          body: entry.body != null ? JSON.stringify(entry.body) : undefined
        }).then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res;
        }).catch(function (error) {
          failures.push(Object.assign({}, entry, { error: error.message || 'sync_failed' }));
        });
      });
    });

    return sequence.then(function () {
      saveQueue(failures);
      setMeta({
        pending: failures.length,
        syncing: false,
        offline: !navigator.onLine,
        lastSyncAt: failures.length ? loadMeta().lastSyncAt : nowIso(),
        lastError: failures.length ? (failures[0].error || 'sync_failed') : ''
      });
      if (!failures.length) {
        return originalFetch(root + 'bootstrap', { headers: { 'Content-Type': 'application/json' } })
          .then(function (res) { return res.ok ? res.json() : null; })
          .then(function (data) {
            if (data) cacheGet('bootstrap', data);
            return true;
          })
          .catch(function () { return true; });
      }
      return false;
    });
  }

  function createBanner() {
    var el = document.createElement('div');
    el.id = 'cspsr-offline-banner';
    el.style.cssText = 'position:fixed;left:16px;bottom:16px;z-index:999999;max-width:360px;padding:10px 14px;border-radius:12px;background:#111827;color:#fff;font:12px/1.5 system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.22);display:none';
    document.body.appendChild(el);
    return el;
  }

  function renderBanner() {
    var el = document.getElementById('cspsr-offline-banner') || createBanner();
    var meta = loadMeta();
    var pending = loadQueue().length;
    var text = '';
    if (!navigator.onLine) {
      text = 'Offline mode active. ' + pending + ' change(s) waiting for sync.';
      el.style.background = '#92400e';
      el.style.display = 'block';
    } else if (meta.syncing) {
      text = 'Syncing queued changes... (' + pending + ' remaining)';
      el.style.background = '#1d4ed8';
      el.style.display = 'block';
    } else if (pending > 0) {
      text = 'Connection back, but ' + pending + ' change(s) still waiting to sync.';
      el.style.background = '#7c2d12';
      el.style.display = 'block';
    } else if (meta.lastSyncAt) {
      text = 'All offline changes synced successfully.';
      el.style.background = '#166534';
      el.style.display = 'block';
      clearTimeout(renderBanner._hideTimer);
      renderBanner._hideTimer = setTimeout(function () {
        el.style.display = 'none';
      }, 3500);
      el.textContent = text;
      return;
    } else {
      el.style.display = 'none';
      return;
    }
    el.textContent = text;
  }

  window.addEventListener('online', function () {
    setMeta({ offline: false, lastError: '' });
    replayQueue().then(renderBanner);
  });
  window.addEventListener('offline', function () {
    setMeta({ offline: true });
    renderBanner();
  });
  window.addEventListener('cspsr-offline-state', renderBanner);
  document.addEventListener('DOMContentLoaded', renderBanner);

  window.fetch = function (input, opts) {
    var method = ((opts && opts.method) || 'GET').toUpperCase();
    var path = normalizeUrl(typeof input === 'string' ? input : (input && input.url));
    if (!path) {
      return originalFetch(input, opts);
    }

    if (method === 'GET') {
      if (!navigator.onLine) {
        var cachedResponse = maybeServeFromCache(path);
        if (cachedResponse) return cachedResponse;
      }
      return originalFetch(input, opts).then(function (response) {
        if (response && response.ok) {
          return cacheSuccessfulGet(path, response);
        }
        return response;
      }).catch(function () {
        var fallback = maybeServeFromCache(path);
        if (fallback) {
          setMeta({ offline: true });
          return fallback;
        }
        throw new Error('Network unavailable and no cached data for ' + path);
      });
    }

    if (!navigator.onLine) {
      var queuedOffline = queueRequest(path, method, opts || {});
      renderBanner();
      return makeResponse(buildOptimisticPayload(path, method, queuedOffline), 202);
    }

    return originalFetch(input, opts).catch(function (error) {
      var message = (error && error.message) ? error.message.toLowerCase() : '';
      if (message.indexOf('network') >= 0 || message.indexOf('failed to fetch') >= 0) {
        var queued = queueRequest(path, method, opts || {});
        renderBanner();
        return makeResponse(buildOptimisticPayload(path, method, queued), 202);
      }
      throw error;
    });
  };

  setMeta({ pending: loadQueue().length, offline: !navigator.onLine });
  if (navigator.onLine && loadQueue().length) replayQueue().then(renderBanner);
})();
