(function () {
  'use strict';

  var STORAGE_KEY = 'right-menu-reading-positions-v1';
  function text(value) { return String(value || '').replace(/\s+/g, ' ').trim(); }
  function markdown(state) {
    var quote = state.selection.split('\n').map(function (line) { return '> ' + line; }).join('\n');
    var title = state.pageTitle.replace(/[\\[\]]/g, '\\$&');
    return quote + '\n\n— [' + title + '](<' + state.pageUrl.replace(/[<>]/g, encodeURIComponent) + '>)';
  }
  function wrap(ctx, value, width) {
    var lines = [];
    String(value).split('\n').forEach(function (paragraph) {
      var line = '';
      Array.from(paragraph).forEach(function (char) {
        if (line && ctx.measureText(line + char).width > width) { lines.push(line); line = ''; }
        line += char;
      });
      lines.push(line);
    });
    return lines;
  }
  function createCard(state) {
    var canvas = document.createElement('canvas');
    canvas.width = 960;
    var ctx = canvas.getContext('2d');
    if (!ctx) { throw new Error('当前浏览器不支持图片卡片'); }
    ctx.font = '32px system-ui, sans-serif';
    var quote = wrap(ctx, state.selection, 800);
    ctx.font = '24px system-ui, sans-serif';
    var title = wrap(ctx, state.pageTitle.slice(0, 100), 800);
    var source = wrap(ctx, state.pageUrl.slice(0, 240), 800);
    canvas.height = 230 + quote.length * 48 + (title.length + source.length) * 34;
    ctx.fillStyle = '#faf8f3';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#9b6b45';
    ctx.fillRect(80, 64, 48, 4);
    ctx.fillStyle = '#27231f';
    ctx.font = '32px system-ui, sans-serif';
    var y = 126;
    quote.forEach(function (line) { ctx.fillText(line, 80, y); y += 48; });
    y += 40;
    ctx.font = '24px system-ui, sans-serif';
    title.forEach(function (line) { ctx.fillText(line, 80, y); y += 34; });
    ctx.fillStyle = '#71695f';
    ctx.font = '20px system-ui, sans-serif';
    source.forEach(function (line) { ctx.fillText(line, 80, y); y += 34; });
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', '摘句分享卡：' + state.selection);
    return canvas;
  }

  window.RightMenuReader = {
    create: function (options) {
      function positions() {
        var raw = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
        return Array.isArray(raw) ? raw.filter(function (entry) {
          return entry && entry.version === 1 && typeof entry.path === 'string' && typeof entry.subjectName === 'string';
        }).slice(0, 50) : [];
      }
      function saved(state) {
        if (!state.post) { return null; }
        try {
          return positions().find(function (entry) {
            return entry.path === window.location.pathname && entry.subjectName === state.post.subjectName;
          }) || null;
        } catch (error) { return null; }
      }
      function paragraph(state) {
        return state.target && state.target.closest('p, li, h1, h2, h3, h4, pre, blockquote');
      }
      function save(state) {
        if (!state.post) { options.notify('当前页面不是文章'); return; }
        try {
          var element = paragraph(state);
          var maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
          var entry = {
            version: 1, path: window.location.pathname, subjectName: state.post.subjectName,
            anchorId: element ? element.id : '', quote: element ? text(element.textContent).slice(0, 160) : '',
            progress: Math.max(0, Math.min(1, window.scrollY / maxScroll)), savedAt: Date.now(),
          };
          var entries = positions().filter(function (old) { return old.path !== entry.path || old.subjectName !== entry.subjectName; });
          entries.unshift(entry);
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, 50)));
          options.notify('已记住阅读位置（保存在此浏览器）');
        } catch (error) { options.notify('无法保存书签，请检查浏览器存储权限'); }
      }
      function resume(state) {
        var entry = saved(state);
        if (!entry) { options.notify('当前文章还没有阅读书签'); return; }
        var element = entry.anchorId ? document.getElementById(entry.anchorId) : null;
        if (element && entry.quote && text(element.textContent).indexOf(entry.quote) < 0) { element = null; }
        if (!element && entry.quote) {
          element = Array.from(document.querySelectorAll('p, li, h1, h2, h3, h4, pre, blockquote')).slice(0, 2000).find(function (node) {
            return text(node.textContent).indexOf(entry.quote) === 0;
          });
        }
        if (element) { element.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        else {
          var progress = Number.isFinite(entry.progress) ? Math.max(0, Math.min(1, entry.progress)) : 0;
          window.scrollTo({ top: progress * Math.max(0, document.documentElement.scrollHeight - window.innerHeight), behavior: 'smooth' });
        }
        options.notify(element ? '已回到上次阅读的位置' : '正文有变化，已回到大致阅读进度');
      }
      function share(state) {
        if (!state.selection || state.selection.length > 1000) { options.notify('请选中 1～1000 字生成分享卡'); return; }
        var panel = options.panels.open('摘句分享卡');
        try {
          var canvas = createCard(state);
          panel.content.appendChild(canvas);
          panel.status('卡片在本地生成，带有文章标题与来源链接。');
          panel.button('保存图片', function () {
            try {
              var anchor = document.createElement('a');
              anchor.href = canvas.toDataURL('image/png');
              anchor.download = state.pageTitle.replace(/[\\/:*?"<>|]/g, '_').slice(0, 60) + '-摘句.png';
              document.body.appendChild(anchor);
              anchor.click();
              anchor.remove();
            } catch (error) { panel.status('图片导出失败，请重试'); }
          });
          panel.button('复制 Markdown 引用', function () {
            options.copyText(markdown(state), state.selectionRanges).then(function (copied) { panel.status(copied ? '已复制 Markdown 引用' : '复制失败，请重试'); });
          });
        } catch (error) { panel.status(error.message); }
      }
      return {
        canShow: function (action, state) {
          if (action === 'createQuoteCard' || action === 'copyMarkdownQuote') { return !!state.selection; }
          if (action === 'saveReadingPosition') { return !!state.post; }
          if (action === 'resumeReadingPosition') { return !!saved(state); }
          return true;
        },
        execute: function (action, state) {
          if (action === 'createQuoteCard') { share(state); }
          if (action === 'copyMarkdownQuote') { options.copyText(markdown(state), state.selectionRanges); }
          if (action === 'saveReadingPosition') { save(state); }
          if (action === 'resumeReadingPosition') { resume(state); }
        },
      };
    },
  };
})();
