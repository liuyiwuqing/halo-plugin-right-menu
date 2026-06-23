(function () {
  'use strict';

  var CONFIG_ID = 'right-menu-config';
  var ROOT_CLASS = 'right-menu-root';
  var TOAST_CLASS = 'right-menu-toast';
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

  function readConfig() {
    var element = document.getElementById(CONFIG_ID);
    if (!element) {
      return { enabled: false, menuItems: [] };
    }
    try {
      return normalizeConfig(JSON.parse(element.textContent || '{}'));
    } catch (error) {
      return { enabled: false, menuItems: [] };
    }
  }

  function normalizeConfig(raw) {
    var style = raw.style || {};
    return {
      enabled: raw.enabled !== false,
      pjaxCompatible: raw.pjaxCompatible !== false,
      showNativeOnEditable: raw.showNativeOnEditable !== false,
      menuItems: Array.isArray(raw.menuItems) ? raw.menuItems.filter(function (item) {
        return item && item.enabled !== false && item.label && item.action;
      }) : [],
      currentPost: normalizePostContext(raw.currentPost || raw.post),
      style: {
        theme: ['auto', 'light', 'dark'].indexOf(style.theme) >= 0 ? style.theme : 'auto',
        primaryColor: String(style.primaryColor || '#111827'),
        menuWidth: clampNumber(style.menuWidth, 180, 320, 220),
        borderRadius: clampNumber(style.borderRadius, 0, 16, 8),
      },
    };
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
    return {
      subjectType: String(post.subjectType || 'POST'),
      subjectName: subjectName,
      subjectTitle: String(post.subjectTitle || document.title || ''),
      permalink: String(post.permalink || window.location.href),
      cover: String(post.cover || ''),
    };
  }

  function init() {
    currentConfig = readConfig();
    if (!currentConfig.enabled) {
      destroy();
      return;
    }
    ensureRoots();
    applyStyle(currentConfig.style);
    bindHandlers();
  }

  function ensureRoots() {
    menuRoot = document.querySelector('.' + ROOT_CLASS);
    if (!menuRoot) {
      menuRoot = document.createElement('div');
      menuRoot.className = ROOT_CLASS;
      menuRoot.setAttribute('role', 'menu');
      menuRoot.setAttribute('aria-hidden', 'true');
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
    addHandler(window, 'scroll', closeMenu, true);
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
    currentConfig = readConfig();
    if (!currentConfig.enabled || !menuRoot) {
      return;
    }
    if (currentConfig.showNativeOnEditable && isEditable(event.target)) {
      return;
    }
    currentState = collectState(event.target);
    var items = currentConfig.menuItems.filter(function (item) {
      return shouldShowItem(item, currentState);
    });
    if (items.length === 0) {
      return;
    }
    event.preventDefault();
    renderMenu(items);
    openMenu(event.clientX, event.clientY);
  }

  function isEditable(target) {
    if (!target || target.nodeType !== 1) {
      return false;
    }
    return !!target.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"], [role="textbox"]');
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
      pageUrl: window.location.href,
      pageTitle: document.title || window.location.href,
      post: currentConfig ? currentConfig.currentPost : null,
    };
  }

  function shouldShowItem(item, state) {
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
    return true;
  }

  function renderMenu(items) {
    var list = document.createElement('ul');
    list.className = 'right-menu-list';
    items.forEach(function (item) {
      var li = document.createElement('li');
      li.className = 'right-menu-item';
      var button = document.createElement('button');
      button.className = 'right-menu-button';
      button.type = 'button';
      button.setAttribute('role', 'menuitem');
      button.dataset.action = item.action;
      button.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        executeAction(item);
      });

      var icon = renderIcon(item);
      var label = document.createElement('span');
      label.className = 'right-menu-label';
      label.textContent = item.label;

      button.appendChild(icon);
      button.appendChild(label);
      li.appendChild(button);
      list.appendChild(li);
    });
    menuRoot.replaceChildren(list);
  }

  function openMenu(clientX, clientY) {
    menuRoot.dataset.open = 'true';
    menuRoot.setAttribute('aria-hidden', 'false');
    menuRoot.style.left = '0px';
    menuRoot.style.top = '0px';

    var rect = menuRoot.getBoundingClientRect();
    var left = Math.min(clientX, window.innerWidth - rect.width - 8);
    var top = Math.min(clientY, window.innerHeight - rect.height - 8);
    menuRoot.style.left = Math.max(8, left) + 'px';
    menuRoot.style.top = Math.max(8, top) + 'px';

    var firstButton = menuRoot.querySelector('button');
    if (firstButton) {
      firstButton.focus({ preventScroll: true });
    }
  }

  function closeMenu() {
    if (!menuRoot) {
      return;
    }
    menuRoot.dataset.open = 'false';
    menuRoot.setAttribute('aria-hidden', 'true');
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      closeMenu();
    }
  }

  function executeAction(item) {
    var state = currentState || collectState(document.body);
    closeMenu();
    switch (item.action) {
      case 'copyPageLink':
        copyText(state.pageUrl);
        break;
      case 'copyPageTitleLink':
        copyText(state.pageTitle + '\n' + state.pageUrl);
        break;
      case 'copySelection':
        copyText(state.selection);
        break;
      case 'copyImageUrl':
        copyText(state.image ? state.image.currentSrc || state.image.src : '');
        break;
      case 'openImage':
        openUrl(state.image ? state.image.currentSrc || state.image.src : '', item.target);
        break;
      case 'copyLinkUrl':
        copyText(state.link ? state.link.href : '');
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
        executeMemberFavorite(state);
        break;
      case 'memberSignIn':
        executeMemberSignIn();
        break;
      case 'openLinksSubmit':
        executeOpenLinksSubmit();
        break;
      default:
        notify('暂不支持该动作');
    }
  }

  function copyText(text) {
    var value = String(text || '').trim();
    if (!value) {
      notify('没有可复制的内容');
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(function () {
        notify('已复制');
      }).catch(function () {
        fallbackCopy(value);
      });
      return;
    }
    fallbackCopy(value);
  }

  function fallbackCopy(value) {
    var textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', 'readonly');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      notify('已复制');
    } catch (error) {
      notify('复制失败');
    } finally {
      textarea.remove();
    }
  }

  function openUrl(url, target) {
    var value = String(url || '').trim();
    if (!value) {
      notify('链接为空');
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
    waitForGlobalApi('memberFavorite', function (api) {
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
        notify(result && result.favorited ? '已加入收藏' : '已取消收藏');
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
    waitForGlobalApi('memberSignIn', function (api) {
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
            notify('今日已签到');
            return null;
          }
          return signInApi.signIn().then(function (result) {
            if (result && result.authenticated === false) {
              redirectToLogin(result.loginUrl || resolveApiLoginUrl(signInApi));
              return;
            }
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
    waitForLinksSubmitApi(3000).then(function (api) {
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

    var source = iconImageSource(normalizeIconValue(item.icon));
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
    var match = icon.match(/^([a-z0-9]+(?:-[a-z0-9]+)*):([a-z0-9]+(?:-[a-z0-9]+)*)$/i);
    if (!match) {
      return '';
    }
    return 'https://api.iconify.design/'
      + encodeURIComponent(match[1])
      + '/'
      + encodeURIComponent(match[2])
      + '.svg';
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
