(function () {
  'use strict';

  var CONFIG_ID = 'right-menu-config';
  var ROOT_CLASS = 'right-menu-root';
  var TOAST_CLASS = 'right-menu-toast';
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var BUILTIN_ICON_SETS = {
    ri: {
      width: 24,
      height: 24,
      icons: {
        'arrow-up-line': '<path fill="currentColor" d="M13 7.828V20h-2V7.828l-5.364 5.364l-1.414-1.414L12 4l7.778 7.778l-1.414 1.414z"/>',
        'calendar-check-line': '<path fill="currentColor" d="M9 1v2h6V1h2v2h4a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4V1zm11 9H4v9h16zm-4.964 1.136l1.414 1.414l-4.95 4.95l-3.536-3.536L9.38 12.55l2.121 2.122zM7 5H4v3h16V5h-3v1h-2V5H9v1H7z"/>',
        'external-link-line': '<path fill="currentColor" d="M10 6v2H5v11h11v-5h2v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zm11-3v8h-2V6.413l-7.793 7.794l-1.414-1.414L17.585 5H13V3z"/>',
        'file-copy-line': '<path fill="currentColor" d="M7 6V3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3v3c0 .552-.45 1-1.007 1H4.007A1 1 0 0 1 3 21l.003-14c0-.552.45-1 1.006-1zM5.002 8L5 20h10V8zM9 6h8v10h2V4H9z"/>',
        'home-4-line': '<path fill="currentColor" d="M19 21H5a1 1 0 0 1-1-1v-9H1l10.327-9.388a1 1 0 0 1 1.346 0L23 11h-3v9a1 1 0 0 1-1 1m-6-2h5V9.157l-6-5.454l-6 5.454V19h5v-6h2z"/>',
        'image-line': '<path fill="currentColor" d="M2.992 21A.993.993 0 0 1 2 20.007V3.993A1 1 0 0 1 2.992 3h18.016c.548 0 .992.445.992.993v16.014a1 1 0 0 1-.992.993zM20 15V5H4v14L14 9zm0 2.828l-6-6L6.828 19H20zM8 11a2 2 0 1 1 0-4a2 2 0 0 1 0 4"/>',
        link: '<path fill="currentColor" d="M18.364 15.536L16.95 14.12l1.414-1.414a5 5 0 0 0-7.071-7.071L9.878 7.05L8.464 5.636l1.414-1.414a7 7 0 0 1 9.9 9.9zm-2.829 2.828l-1.414 1.414a7 7 0 0 1-9.9-9.9l1.415-1.414L7.05 9.88l-1.414 1.414a5 5 0 0 0 7.07 7.071l1.415-1.414zm-.707-10.607l1.415 1.415l-7.072 7.07l-1.414-1.414z"/>',
        'links-fill': '<path fill="currentColor" d="m13.06 8.111l1.415 1.414a7 7 0 0 1 0 9.9l-.354.353a7 7 0 1 1-9.9-9.9l1.415 1.415a5 5 0 1 0 7.071 7.071l.354-.354a5 5 0 0 0 0-7.07l-1.415-1.415zm6.718 6.01l-1.414-1.414a5 5 0 0 0-7.071-7.07l-.354.353a5 5 0 0 0 0 7.07l1.415 1.415l-1.415 1.414l-1.414-1.414a7 7 0 0 1 0-9.9l.354-.353a7 7 0 1 1 9.9 9.9"/>',
        'links-line': '<path fill="currentColor" d="m13.06 8.111l1.415 1.414a7 7 0 0 1 0 9.9l-.354.353a7 7 0 1 1-9.9-9.9l1.415 1.415a5 5 0 1 0 7.071 7.071l.354-.354a5 5 0 0 0 0-7.07l-1.415-1.415zm6.718 6.01l-1.414-1.414a5 5 0 0 0-7.071-7.07l-.354.353a5 5 0 0 0 0 7.07l1.415 1.415l-1.415 1.414l-1.414-1.414a7 7 0 0 1 0-9.9l.354-.353a7 7 0 1 1 9.9 9.9"/>',
        'refresh-line': '<path fill="currentColor" d="M5.463 4.433A9.96 9.96 0 0 1 12 2c5.523 0 10 4.477 10 10c0 2.136-.67 4.116-1.81 5.74L17 12h3A8 8 0 0 0 6.46 6.228zm13.074 15.134A9.96 9.96 0 0 1 12 22C6.477 22 2 17.523 2 12c0-2.136.67-4.116 1.81-5.74L7 12H4a8 8 0 0 0 13.54 5.772z"/>',
        'search-line': '<path fill="currentColor" d="m18.031 16.617l4.283 4.282l-1.415 1.415l-4.282-4.283A8.96 8.96 0 0 1 11 20c-4.968 0-9-4.032-9-9s4.032-9 9-9s9 4.032 9 9a8.96 8.96 0 0 1-1.969 5.617m-2.006-.742A6.98 6.98 0 0 0 18 11c0-3.867-3.133-7-7-7s-7 3.133-7 7s3.133 7 7 7a6.98 6.98 0 0 0 4.875-1.975z"/>',
        'star-line': '<path fill="currentColor" d="m12 18.26l-7.053 3.948l1.575-7.928L.588 8.792l8.027-.952L12 .5l3.385 7.34l8.027.952l-5.934 5.488l1.575 7.928zm0-2.292l4.247 2.377l-.948-4.773l3.573-3.305l-4.833-.573l-2.038-4.419l-2.039 4.42l-4.833.572l3.573 3.305l-.948 4.773z"/>',
        text: '<path fill="currentColor" d="M13 6v15h-2V6H5V4h14v2z"/>',
      },
    },
  };
  var runtime = window.__rightMenuRuntime;
  if (runtime && typeof runtime.destroy === 'function') {
    runtime.destroy();
  }

  var menuRoot = null;
  var toastRoot = null;
  var toastTimer = null;
  var currentState = null;
  var currentConfig = null;
  var removeHandlers = [];
  var returnFocus = null;
  var pendingActions = new Set();
  var favoriteStates = new Map();
  var signedToday = false;
  var panels = null;
  var reader = null;
  var ai = null;

  function readConfig() {
    var element = document.getElementById(CONFIG_ID);
    if (!element) {
      // Site rules survive PJAX, but page-specific article identity must not.
      return currentConfig ? Object.assign({}, currentConfig, { currentPost: null }) : disabledConfig();
    }
    try {
      return normalizeConfig(JSON.parse(element.textContent || '{}'));
    } catch (error) {
      return disabledConfig();
    }
  }

  function disabledConfig() {
    return {
      enabled: false,
      pjaxCompatible: true,
      showNativeOnEditable: true,
      includePaths: [],
      excludePaths: [],
      menuItems: [],
      currentPost: null,
      style: {
        theme: 'auto',
        primaryColor: '#111827',
        menuWidth: 220,
        borderRadius: 8,
      },
    };
  }

  function normalizeConfig(raw) {
    var style = raw.style || {};
    return {
      enabled: raw.enabled !== false,
      pjaxCompatible: raw.pjaxCompatible !== false,
      showNativeOnEditable: raw.showNativeOnEditable !== false,
      includePaths: normalizePathRules(raw.includePaths),
      excludePaths: normalizePathRules(raw.excludePaths),
      menuItems: Array.isArray(raw.menuItems) ? raw.menuItems.filter(function (item) {
        return item && item.enabled !== false && item.label && item.action;
      }) : [],
      currentPost: normalizePostContext(raw.currentPost || raw.post),
      groupMenu: raw.groupMenu !== false,
      style: {
        theme: ['auto', 'light', 'dark'].indexOf(style.theme) >= 0 ? style.theme : 'auto',
        primaryColor: String(style.primaryColor || '#111827'),
        menuWidth: clampNumber(style.menuWidth, 180, 320, 220),
        borderRadius: clampNumber(style.borderRadius, 0, 16, 8),
      },
    };
  }

  function normalizePathRules(rules) {
    if (!Array.isArray(rules)) {
      return [];
    }
    return rules.map(function (rule) {
      return String(rule || '').trim();
    }).filter(function (rule) {
      return !!rule;
    });
  }

  function clampNumber(value, min, max, fallback) {
    var numberValue = Number(value);
    if (!Number.isFinite(numberValue)) {
      return fallback;
    }
    return Math.min(max, Math.max(min, numberValue));
  }

  function normalizePostContext(post) {
    if (!post || typeof post !== 'object') {
      return null;
    }
    var subjectName = String(post.subjectName || '').trim();
    if (!subjectName) {
      return null;
    }
    try {
      var permalink = new URL(post.permalink || window.location.href, window.location.href);
      if (permalink.origin !== window.location.origin || permalink.pathname !== window.location.pathname) {
        return null;
      }
    } catch (error) {
      return null;
    }
    return {
      subjectType: String(post.subjectType || 'POST'),
      subjectName: subjectName,
      subjectTitle: String(post.subjectTitle || document.title || ''),
      permalink: String(post.permalink || window.location.href),
      cover: String(post.cover || ''),
    };
  }

  function init() {
    if (panels) { panels.close(); }
    currentConfig = readConfig();
    bindHandlers();
    if (!isRuntimeEnabled(currentConfig)) {
      deactivate();
      return;
    }
    ensureRoots();
    if (!panels && window.RightMenuPanel) { panels = window.RightMenuPanel.create(); }
    if (!reader && panels && window.RightMenuReader) {
      reader = window.RightMenuReader.create({ panels: panels, notify: notify, copyText: copyText });
    }
    if (!ai && panels && window.RightMenuAi) {
      ai = window.RightMenuAi.create({ panels: panels, notify: notify, copyText: copyText });
    }
    if (ai) { ai.refresh(); }
    applyStyle(currentConfig.style);
    closeMenu();
    menuRoot.replaceChildren();
    currentState = null;
  }

  function ensureRoots() {
    menuRoot = document.querySelector('.' + ROOT_CLASS);
    if (!menuRoot) {
      menuRoot = document.createElement('div');
      menuRoot.className = ROOT_CLASS;
      menuRoot.setAttribute('role', 'menu');
      menuRoot.setAttribute('aria-hidden', 'true');
      menuRoot.hidden = true;
      document.body.appendChild(menuRoot);
    }
    toastRoot = document.querySelector('.' + TOAST_CLASS);
    if (!toastRoot) {
      toastRoot = document.createElement('div');
      toastRoot.className = TOAST_CLASS;
      toastRoot.setAttribute('role', 'status');
      toastRoot.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastRoot);
    }
  }

  function applyStyle(style) {
    menuRoot.dataset.theme = style.theme;
    menuRoot.style.setProperty('--right-menu-primary', style.primaryColor);
    menuRoot.style.setProperty('--right-menu-width', style.menuWidth + 'px');
    menuRoot.style.setProperty('--right-menu-radius', style.borderRadius + 'px');
  }

  function bindHandlers() {
    if (removeHandlers.length > 0) {
      return;
    }
    addHandler(document, 'contextmenu', handleContextMenu);
    addHandler(document, 'click', closeMenu);
    addHandler(document, 'keydown', handleKeyDown);
    addHandler(window, 'resize', closeMenu);
    addHandler(window, 'scroll', function (event) {
      if (!menuRoot || !menuRoot.contains(event.target)) {
        closeMenu();
      }
    }, true);
    if (currentConfig && currentConfig.pjaxCompatible) {
      ['pjax:complete', 'pjax:end', 'turbo:load', 'swup:contentReplaced'].forEach(function (eventName) {
        addHandler(document, eventName, init);
      });
    }
  }

  function addHandler(target, eventName, handler, options) {
    target.addEventListener(eventName, handler, options || false);
    removeHandlers.push(function () {
      target.removeEventListener(eventName, handler, options || false);
    });
  }

  function handleContextMenu(event) {
    closeMenu();
    if (event.shiftKey) {
      return;
    }
    currentConfig = readConfig();
    if (!isRuntimeEnabled(currentConfig)) {
      closeMenu();
      return;
    }
    if (!menuRoot || !toastRoot) {
      ensureRoots();
    }
    applyStyle(currentConfig.style);
    if (currentConfig.showNativeOnEditable && isEditable(event.target)) {
      return;
    }
    currentState = collectState(event.target);
    var items = currentConfig.menuItems.filter(function (item) {
      return shouldShowItem(item, currentState);
    });
    if (items.length === 0) {
      menuRoot.replaceChildren();
      return;
    }
    event.preventDefault();
    renderMenu(items);
    var anchor = event.target && event.target.getBoundingClientRect ? event.target.getBoundingClientRect() : null;
    openMenu(event.clientX || (anchor ? anchor.left : 8), event.clientY || (anchor ? anchor.bottom : 8));
    refreshIntegrationStatus(currentState);
  }

  function isRuntimeEnabled(config) {
    return !!(config && config.enabled && matchesPath(
      window.location.pathname || '/',
      config.includePaths,
      config.excludePaths
    ));
  }

  function matchesPath(requestPath, includeRules, excludeRules) {
    var normalizedPath = normalizePath(requestPath);
    if (!normalizedPath) {
      return false;
    }
    if (!isBlankRules(excludeRules) && excludeRules.some(function (rule) {
      return matchesRule(normalizedPath, rule);
    })) {
      return false;
    }
    if (isBlankRules(includeRules)) {
      return true;
    }
    return includeRules.some(function (rule) {
      return matchesRule(normalizedPath, rule);
    });
  }

  function isBlankRules(rules) {
    return !Array.isArray(rules) || rules.every(function (rule) {
      return !String(rule || '').trim();
    });
  }

  function matchesRule(requestPath, rule) {
    var pathRule = String(rule || '').trim();
    if (!pathRule) {
      return false;
    }
    if (pathRule === requestPath) {
      return true;
    }
    if (pathRule.endsWith('/**')) {
      var recursivePrefix = pathRule.slice(0, -3);
      return requestPath === recursivePrefix || requestPath.indexOf(recursivePrefix + '/') === 0;
    }
    if (pathRule.endsWith('/*')) {
      var singlePrefix = pathRule.slice(0, -2);
      if (requestPath.indexOf(singlePrefix + '/') !== 0) {
        return false;
      }
      var remainingPath = requestPath.slice(singlePrefix.length + 1);
      return !!remainingPath && remainingPath.indexOf('/') < 0;
    }
    if (pathRule.indexOf('{') >= 0 && pathRule.indexOf('}') >= 0) {
      return new RegExp(toPathVariableRegex(pathRule)).test(requestPath);
    }
    return false;
  }

  function toPathVariableRegex(rule) {
    var regex = '^';
    var literal = '';
    var inVariable = false;
    for (var index = 0; index < rule.length; index++) {
      var current = rule.charAt(index);
      if (current === '{') {
        regex += escapeRegex(literal) + '[^/]+';
        literal = '';
        inVariable = true;
      } else if (current === '}' && inVariable) {
        inVariable = false;
      } else if (!inVariable) {
        literal += current;
      }
    }
    return regex + escapeRegex(literal) + '$';
  }

  function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function normalizePath(requestPath) {
    if (requestPath === null || requestPath === undefined) {
      return '';
    }
    var path = String(requestPath).trim();
    if (!path) {
      return '';
    }
    var queryIndex = path.indexOf('?');
    if (queryIndex >= 0) {
      path = path.slice(0, queryIndex);
    }
    var hashIndex = path.indexOf('#');
    if (hashIndex >= 0) {
      path = path.slice(0, hashIndex);
    }
    if (path.charAt(0) !== '/') {
      return '/' + path;
    }
    return path;
  }

  function isEditable(target) {
    if (!target || target.nodeType !== 1) {
      return false;
    }
    return target.isContentEditable || !!target.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"], [contenteditable="plaintext-only"], [role="textbox"]');
  }

  function collectState(target) {
    var element = target && target.nodeType === 1 ? target : null;
    var link = element ? element.closest('a[href]') : null;
    var image = element ? element.closest('img') : null;
    var selection = String(window.getSelection ? window.getSelection().toString() : '').trim();
    return {
      target: element,
      link: link,
      image: image,
      selection: selection,
      selectionRanges: snapshotSelection(),
      pageUrl: window.location.href,
      pageTitle: document.title || window.location.href,
      post: currentConfig ? currentConfig.currentPost : null,
    };
  }

  function shouldShowItem(item, state) {
    if (/^ai(Explain|Example|Translate)$/.test(item.action) && (!ai || !ai.canShow(item.action, state))) { return false; }
    if (['createQuoteCard', 'copyMarkdownQuote', 'saveReadingPosition', 'resumeReadingPosition'].indexOf(item.action) >= 0 && (!reader || !reader.canShow(item.action, state))) {
      return false;
    }
    if (item.action === 'memberFavorite' && (!resolveFavoriteSubject(state) || !window.memberFavorite || typeof window.memberFavorite.toggle !== 'function')) {
      return false;
    }
    if (item.action === 'memberSignIn' && (!window.memberSignIn || typeof window.memberSignIn.getStatus !== 'function' || typeof window.memberSignIn.signIn !== 'function')) {
      return false;
    }
    if (item.action === 'openLinksSubmit' && (!document.getElementById('linksSubmit-overlay') || !linksSubmitApi())) {
      return false;
    }
    var context = item.context || 'common';
    if (context === 'text') {
      return !!state.selection;
    }
    if (context === 'link') {
      return !!state.link;
    }
    if (context === 'image') {
      return !!state.image;
    }
    if (context === 'article') { return !!state.post; }
    return true;
  }

  function renderMenu(items) {
    var list = document.createElement('ul');
    list.className = 'right-menu-list';
    if (currentConfig.groupMenu) {
      var groups = new Map();
      items.forEach(function (item) {
        var group = menuGroup(item);
        if (!groups.has(group)) { groups.set(group, []); }
        groups.get(group).push(item);
      });
      items = [];
      groups.forEach(function (entries, group) {
        items.push({ heading: group });
        items = items.concat(entries);
      });
    }
    items.forEach(function (item) {
      var li = document.createElement('li');
      if (item.heading) {
        li.className = 'right-menu-group';
        li.setAttribute('role', 'presentation');
        li.textContent = item.heading;
        list.appendChild(li);
        return;
      }
      li.className = 'right-menu-item';
      li.setAttribute('role', 'none');
      var button = document.createElement('button');
      button.className = 'right-menu-button';
      button.type = 'button';
      button.setAttribute('role', 'menuitem');
      button.tabIndex = -1;
      button.dataset.action = item.action;
      button.disabled = pendingActions.has(actionKey(item, currentState));
      button.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        executeAction(item);
      });

      var icon = renderIcon(item);
      var label = document.createElement('span');
      label.className = 'right-menu-label';
      label.textContent = actionLabel(item, currentState);

      button.appendChild(icon);
      button.appendChild(label);
      li.appendChild(button);
      list.appendChild(li);
    });
    menuRoot.replaceChildren(list);
  }

  function menuGroup(item) {
    var labels = { reading: '阅读工具', sharing: '复制与分享', navigation: '页面导航', interaction: '站点互动', custom: '自定义' };
    if (item.group && item.group !== 'auto') { return labels[item.group] || labels.custom; }
    if (/^(ai|createQuote|saveReading|resumeReading)/.test(item.action)) { return labels.reading; }
    if (/^copy/.test(item.action)) { return labels.sharing; }
    if (/^(member|openLinksSubmit)/.test(item.action)) { return labels.interaction; }
    return labels.navigation;
  }

  function openMenu(clientX, clientY) {
    returnFocus = document.activeElement;
    menuRoot.hidden = false;
    menuRoot.dataset.open = 'true';
    menuRoot.setAttribute('aria-hidden', 'false');
    menuRoot.style.left = '0px';
    menuRoot.style.top = '0px';

    var rect = menuRoot.getBoundingClientRect();
    var left = Math.min(clientX, window.innerWidth - rect.width - 8);
    var top = Math.min(clientY, window.innerHeight - rect.height - 8);
    menuRoot.style.left = Math.max(8, left) + 'px';
    menuRoot.style.top = Math.max(8, top) + 'px';

    var firstButton = menuRoot.querySelector('button:not(:disabled)');
    if (firstButton) {
      firstButton.focus({ preventScroll: true });
    }
  }

  function closeMenu(restoreFocus) {
    if (!menuRoot) {
      return;
    }
    menuRoot.dataset.open = 'false';
    menuRoot.setAttribute('aria-hidden', 'true');
    menuRoot.hidden = true;
    if (restoreFocus !== false && menuRoot.contains(document.activeElement) && returnFocus && returnFocus.isConnected) {
      returnFocus.focus({ preventScroll: true });
    }
  }

  function deactivate() {
    if (panels) { panels.close(); }
    currentState = null;
    closeMenu();
    if (toastRoot) {
      toastRoot.dataset.open = 'false';
    }
    window.clearTimeout(toastTimer);
  }

  function handleKeyDown(event) {
    if (!menuRoot || menuRoot.hidden) {
      return;
    }
    if (event.key === 'Escape') {
      closeMenu();
      event.preventDefault();
      return;
    }
    if (event.key === 'Tab') {
      closeMenu();
      return;
    }
    var buttons = Array.from(menuRoot.querySelectorAll('button:not(:disabled)'));
    if (!buttons.length || ['ArrowDown', 'ArrowUp', 'Home', 'End'].indexOf(event.key) < 0) {
      return;
    }
    event.preventDefault();
    var index = buttons.indexOf(document.activeElement);
    if (event.key === 'Home') { index = 0; }
    else if (event.key === 'End') { index = buttons.length - 1; }
    else { index = (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length; }
    buttons[index].focus();
  }

  function actionKey(item, state) {
    var subject = item.action === 'memberFavorite' ? resolveFavoriteSubject(state) : null;
    return item.action + ':' + (subject ? subject.subjectName : '');
  }

  function actionLabel(item, state) {
    if (pendingActions.has(actionKey(item, state))) { return '处理中…'; }
    if (item.action === 'memberFavorite') {
      var subject = resolveFavoriteSubject(state);
      if (subject && favoriteStates.get(subject.subjectName)) { return '取消收藏'; }
    }
    if (item.action === 'memberSignIn' && signedToday) { return '今日已签到'; }
    return item.label;
  }

  function runPluginAction(item, state, execute) {
    var key = actionKey(item, state);
    if (pendingActions.has(key)) { return; }
    pendingActions.add(key);
    notify('处理中…');
    Promise.resolve().then(execute).catch(function () {
      notify('操作失败，请稍后重试');
    }).finally(function () {
      pendingActions.delete(key);
      refreshActionButtons();
    });
  }

  function refreshActionButtons() {
    if (!menuRoot || menuRoot.hidden || !currentState) { return; }
    currentConfig.menuItems.forEach(function (item) {
      var button = Array.from(menuRoot.querySelectorAll('button')).find(function (node) { return node.dataset.action === item.action; });
      if (button) {
        button.disabled = pendingActions.has(actionKey(item, currentState));
        button.querySelector('.right-menu-label').textContent = actionLabel(item, currentState);
      }
    });
  }

  function refreshIntegrationStatus(state) {
    var subject = resolveFavoriteSubject(state);
    if (subject && window.memberFavorite && typeof window.memberFavorite.getStatus === 'function' && menuRoot.querySelector('[data-action="memberFavorite"]')) {
      Promise.resolve().then(function () { return window.memberFavorite.getStatus(subject); }).then(function (result) {
        if (currentState !== state || pendingActions.has('memberFavorite:' + subject.subjectName)) { return; }
        if (result && result.authenticated !== false && typeof result.favorited === 'boolean') {
          favoriteStates.set(subject.subjectName, result.favorited);
          refreshActionButtons();
        }
      }).catch(function () { /* Opening a menu must not trigger a login redirect. */ });
    }
    if (window.memberSignIn && menuRoot.querySelector('[data-action="memberSignIn"]')) {
      Promise.resolve().then(function () { return loadMemberSignInConfig(window.memberSignIn); }).then(function (config) {
        if (currentState !== state) { return null; }
        if (config && config.enabled === false) {
          var button = menuRoot.querySelector('[data-action="memberSignIn"]');
          if (button) { button.closest('li').remove(); }
          return null;
        }
        return window.memberSignIn.getStatus();
      }).then(function (result) {
        if (currentState !== state || pendingActions.has('memberSignIn:')) { return; }
        if (result && result.authenticated !== false) {
          signedToday = !!result.signed;
          refreshActionButtons();
        }
      }).catch(function () { /* The action handles errors if the visitor chooses it. */ });
    }
  }

  function executeAction(item) {
    var state = currentState || collectState(document.body);
    closeMenu();
    switch (item.action) {
      case 'aiExplain':
      case 'aiExample':
      case 'aiTranslate':
        if (ai) { ai.execute(item.action, state); }
        break;
      case 'createQuoteCard':
      case 'copyMarkdownQuote':
      case 'saveReadingPosition':
      case 'resumeReadingPosition':
        if (reader) { reader.execute(item.action, state); }
        break;
      case 'copyPageLink':
        copyText(state.pageUrl, state.selectionRanges);
        break;
      case 'copyPageTitleLink':
        copyText(state.pageTitle + '\n' + state.pageUrl, state.selectionRanges);
        break;
      case 'copySelection':
        copyText(state.selection, state.selectionRanges);
        break;
      case 'copyImageUrl':
        copyText(state.image ? state.image.currentSrc || state.image.src : '', state.selectionRanges);
        break;
      case 'openImage':
        openUrl(state.image ? state.image.currentSrc || state.image.src : '', item.target);
        break;
      case 'copyLinkUrl':
        copyText(state.link ? state.link.href : '', state.selectionRanges);
        break;
      case 'openLink':
        openUrl(state.link ? state.link.href : '', item.target);
        break;
      case 'scrollTop':
        window.scrollTo({ top: 0, behavior: 'smooth' });
        break;
      case 'reload':
        window.location.reload();
        break;
      case 'home':
        openUrl('/', '_self');
        break;
      case 'search':
        openUrl(searchUrl(state.selection), '_self');
        break;
      case 'customLink':
        openUrl(interpolateUrl(item.url || '', state), item.target);
        break;
      case 'memberFavorite':
        runPluginAction(item, state, function () { return executeMemberFavorite(state); });
        break;
      case 'memberSignIn':
        runPluginAction(item, state, executeMemberSignIn);
        break;
      case 'openLinksSubmit':
        runPluginAction(item, state, executeOpenLinksSubmit);
        break;
      default:
        notify('暂不支持该动作');
    }
  }

  function snapshotSelection() {
    var selection = window.getSelection();
    var ranges = [];
    for (var index = 0; selection && index < selection.rangeCount; index++) {
      ranges.push(selection.getRangeAt(index).cloneRange());
    }
    return ranges;
  }

  function copyText(text, ranges) {
    var value = String(text || '').trim();
    if (!value) {
      notify('没有可复制的内容');
      return Promise.resolve(false);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(value).then(function () {
        notify('已复制');
        return true;
      }).catch(function () {
        return fallbackCopy(value, ranges);
      });
    }
    return Promise.resolve(fallbackCopy(value, ranges));
  }

  function fallbackCopy(value, ranges) {
    var selection = window.getSelection();
    ranges = ranges || snapshotSelection();
    var activeElement = document.activeElement;
    var textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', 'readonly');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    var copied = false;
    try {
      copied = !!document.execCommand('copy');
      notify(copied ? '已复制' : '复制失败');
    } catch (error) {
      notify('复制失败');
    } finally {
      textarea.remove();
      if (activeElement && activeElement.isConnected) { activeElement.focus({ preventScroll: true }); }
      if (selection) {
        selection.removeAllRanges();
        ranges.forEach(function (range) { selection.addRange(range); });
      }
    }
    return copied;
  }

  function openUrl(url, target) {
    var value = String(url || '').trim();
    if (!value) {
      notify('链接为空');
      return;
    }
    try {
      var parsed = new URL(value, window.location.href);
      if (['http:', 'https:', 'mailto:', 'tel:'].indexOf(parsed.protocol) < 0) {
        notify('不支持的链接协议');
        return;
      }
    } catch (error) {
      notify('链接格式无效');
      return;
    }
    if (target === '_blank') {
      window.open(value, '_blank', 'noopener,noreferrer');
      return;
    }
    window.location.href = value;
  }

  function searchUrl(selection) {
    var keyword = String(selection || '').trim();
    return keyword ? '/search?keyword=' + encodeURIComponent(keyword) : '/search';
  }

  function interpolateUrl(url, state) {
    return String(url || '')
      .replaceAll('{url}', encodeURIComponent(state.pageUrl))
      .replaceAll('{title}', encodeURIComponent(state.pageTitle))
      .replaceAll('{selection}', encodeURIComponent(state.selection || ''));
  }

  function executeMemberFavorite(state) {
    var subject = resolveFavoriteSubject(state);
    if (!subject) {
      notify('当前页面没有可收藏的文章');
      return;
    }

    var favoriteApi = null;
    return waitForGlobalApi('memberFavorite', function (api) {
      return api && typeof api.toggle === 'function';
    }, 3000).then(function (api) {
      favoriteApi = api;
      if (!favoriteApi) {
        notify('会员收藏需要启用会员插件');
        return null;
      }
      return favoriteApi.toggle(subject).then(function (result) {
        if (result && result.authenticated === false) {
          redirectToLogin(result.loginUrl || resolveApiLoginUrl(favoriteApi));
          return;
        }
        if (!result || typeof result.favorited !== 'boolean') {
          notify('收藏状态未返回，请稍后重试');
          return;
        }
        favoriteStates.set(subject.subjectName, result.favorited);
        notify(result.favorited ? '已加入收藏' : '已取消收藏');
      });
    }).catch(function (error) {
      if (isUnauthorized(error)) {
        redirectToLogin(resolveApiLoginUrl(favoriteApi));
        return;
      }
      notify('会员收藏失败，请稍后重试');
    });
  }

  function executeMemberSignIn() {
    var signInApi = null;
    return waitForGlobalApi('memberSignIn', function (api) {
      return api && typeof api.getStatus === 'function' && typeof api.signIn === 'function';
    }, 3000).then(function (api) {
      signInApi = api;
      if (!signInApi) {
        notify('会员签到需要启用会员插件');
        return null;
      }
      return loadMemberSignInConfig(signInApi).then(function (config) {
        if (config && config.enabled === false) {
          notify('会员签到未启用');
          return null;
        }
        return signInApi.getStatus().then(function (status) {
          if (status && status.authenticated === false) {
            redirectToLogin(status.loginUrl || resolveApiLoginUrl(signInApi));
            return null;
          }
          if (status && status.signed) {
            signedToday = true;
            notify('今日已签到');
            return null;
          }
          return signInApi.signIn().then(function (result) {
            if (result && result.authenticated === false) {
              redirectToLogin(result.loginUrl || resolveApiLoginUrl(signInApi));
              return;
            }
            signedToday = true;
            notify(result && result.message ? result.message : '签到成功');
          });
        });
      });
    }).catch(function (error) {
      if (isUnauthorized(error)) {
        redirectToLogin(resolveApiLoginUrl(signInApi));
        return;
      }
      notify('会员签到失败，请稍后重试');
    });
  }

  function executeOpenLinksSubmit() {
    return waitForLinksSubmitApi(3000).then(function (api) {
      if (!api) {
        notify('申请友链需要启用友链自助提交插件');
        return;
      }
      if (!document.getElementById('linksSubmit-overlay')) {
        notify('友链申请弹窗未注入');
        return;
      }
      api.openLinksSubmitOverlay();
    }).catch(function () {
      notify('友链申请弹窗打开失败');
    });
  }

  function resolveFavoriteSubject(state) {
    if (state && state.post && state.post.subjectName) {
      return state.post;
    }
    var widget = document.querySelector('[data-member-favorite-subject]');
    var subjectName = widget && widget.dataset ? String(widget.dataset.memberFavoriteSubject || '').trim() : '';
    if (!subjectName) {
      return null;
    }
    return {
      subjectType: 'POST',
      subjectName: subjectName,
      subjectTitle: document.title || '',
      permalink: window.location.href,
      cover: '',
    };
  }

  function loadMemberSignInConfig(api) {
    if (api && typeof api.getMergedConfig === 'function') {
      return api.getMergedConfig();
    }
    if (api && typeof api.getConfig === 'function') {
      return api.getConfig();
    }
    return Promise.resolve({ enabled: true });
  }

  function waitForLinksSubmitApi(timeout) {
    var ready = linksSubmitApi();
    if (ready) { return Promise.resolve(ready); }
    return waitForGlobalApi('LinksSubmit', function (api) {
      return api && typeof api.openLinksSubmitOverlay === 'function';
    }, timeout).then(function (api) {
      if (api) {
        return api;
      }
      if (typeof window.openLinksSubmitOverlay === 'function') {
        return {
          openLinksSubmitOverlay: window.openLinksSubmitOverlay,
        };
      }
      return null;
    });
  }

  function linksSubmitApi() {
    if (window.LinksSubmit && typeof window.LinksSubmit.openLinksSubmitOverlay === 'function') {
      return window.LinksSubmit;
    }
    return typeof window.openLinksSubmitOverlay === 'function' ? { openLinksSubmitOverlay: window.openLinksSubmitOverlay } : null;
  }

  function waitForGlobalApi(name, isReady, timeout) {
    var maxWait = timeout || 3000;
    var startedAt = Date.now();
    return new Promise(function (resolve) {
      function check() {
        var api = window[name];
        if (isReady(api)) {
          resolve(api);
          return;
        }
        if (Date.now() - startedAt >= maxWait) {
          resolve(null);
          return;
        }
        window.setTimeout(check, 50);
      }
      check();
    });
  }

  function resolveApiLoginUrl(api) {
    if (api && typeof api.getLoginUrl === 'function') {
      return api.getLoginUrl();
    }
    return '/login?redirect_uri=' + encodeURIComponent(window.location.pathname + window.location.search + window.location.hash);
  }

  function redirectToLogin(loginUrl) {
    window.location.href = loginUrl || resolveApiLoginUrl(null);
  }

  function isUnauthorized(error) {
    return error && (error.status === 401 || error.status === 403);
  }

  function renderIcon(item) {
    var icon = document.createElement('span');
    icon.className = 'right-menu-icon';
    icon.setAttribute('aria-hidden', 'true');

    var iconValue = normalizeIconValue(item.icon);
    var inlineIcon = renderInlineIcon(iconValue);
    if (inlineIcon) {
      icon.appendChild(inlineIcon);
      return icon;
    }

    var source = iconImageSource(iconValue);
    if (!source) {
      renderFallbackIcon(icon, item.action);
      return icon;
    }

    var image = document.createElement('img');
    image.className = 'right-menu-icon-image';
    image.alt = '';
    image.decoding = 'async';
    image.loading = 'lazy';
    image.src = source;
    image.addEventListener('error', function () {
      renderFallbackIcon(icon, item.action);
    }, { once: true });
    icon.appendChild(image);
    return icon;
  }

  function renderInlineIcon(icon) {
    var iconData = resolveBuiltinIcon(icon);
    if (!iconData) {
      return null;
    }
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.classList.add('right-menu-icon-svg');
    svg.setAttribute('viewBox', '0 0 ' + iconData.width + ' ' + iconData.height);
    svg.setAttribute('focusable', 'false');
    svg.innerHTML = iconData.body;
    return svg;
  }

  function resolveBuiltinIcon(icon) {
    var parts = iconParts(icon);
    if (!parts) {
      return null;
    }
    var iconSet = BUILTIN_ICON_SETS[parts.prefix];
    if (!iconSet || !iconSet.icons[parts.name]) {
      return null;
    }
    return {
      width: iconSet.width,
      height: iconSet.height,
      body: iconSet.icons[parts.name],
    };
  }

  function normalizeIconValue(icon) {
    if (!icon) {
      return '';
    }
    if (typeof icon === 'string') {
      return icon.trim();
    }
    if (typeof icon === 'object') {
      return String(icon.value || icon.url || icon.name || '').trim();
    }
    return '';
  }

  function iconImageSource(icon) {
    if (!icon) {
      return '';
    }
    if (/^data:image\//i.test(icon) || /^https?:\/\//i.test(icon) || icon.charAt(0) === '/') {
      return icon;
    }
    if (/^<svg[\s>]/i.test(icon)) {
      return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(icon);
    }
    var parts = iconParts(icon);
    if (!parts) {
      return '';
    }
    return 'https://api.iconify.design/'
      + encodeURIComponent(parts.prefix)
      + '/'
      + encodeURIComponent(parts.name)
      + '.svg';
  }

  function iconParts(icon) {
    var match = icon.match(/^([a-z0-9]+(?:-[a-z0-9]+)*):([a-z0-9]+(?:-[a-z0-9]+)*)$/i);
    if (!match) {
      return null;
    }
    return {
      prefix: match[1].toLowerCase(),
      name: match[2].toLowerCase(),
    };
  }

  function renderFallbackIcon(icon, action) {
    icon.replaceChildren();
    icon.classList.add('right-menu-icon-fallback');
    icon.textContent = iconText(action);
  }

  function iconText(action) {
    var icons = {
      copyPageLink: 'L',
      copyPageTitleLink: 'C',
      copySelection: 'T',
      copyImageUrl: 'I',
      openImage: 'O',
      copyLinkUrl: 'L',
      openLink: 'O',
      scrollTop: '^',
      reload: 'R',
      home: 'H',
      search: 'S',
      customLink: '*',
      memberFavorite: 'F',
      memberSignIn: 'M',
      openLinksSubmit: 'L',
    };
    return icons[action] || '*';
  }

  function notify(message) {
    if (!toastRoot) {
      return;
    }
    toastRoot.textContent = message;
    toastRoot.dataset.open = 'true';
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toastRoot.dataset.open = 'false';
    }, 1500);
  }

  function destroy() {
    if (ai) { ai.destroy(); ai = null; }
    if (panels) { panels.destroy(); panels = null; reader = null; }
    removeHandlers.forEach(function (remove) {
      remove();
    });
    removeHandlers = [];
    if (menuRoot) {
      menuRoot.remove();
      menuRoot = null;
    }
    if (toastRoot) {
      toastRoot.remove();
      toastRoot = null;
    }
    window.clearTimeout(toastTimer);
  }

  window.__rightMenuRuntime = { init: init, destroy: destroy };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
