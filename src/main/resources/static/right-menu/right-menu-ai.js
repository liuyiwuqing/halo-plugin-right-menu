(function () {
  'use strict';
  var API = '/apis/api.right-menu.muyin.site/v1alpha1/ai';
  var modes = { aiExplain: 'explain', aiExample: 'example', aiTranslate: 'translate' };
  var labels = { explain: '通俗解释', example: '举个例子', translate: '翻译选区' };

  window.RightMenuAi = {
    create: function (options) {
      var config = { enabled: false, available: false, maxInputCharacters: 3000 };
      var configController = null;
      var requestController = null;
      var sequence = 0;
      function stop() {
        sequence++;
        if (requestController) { requestController.abort(); requestController = null; }
      }
      function refresh() {
        if (configController) { configController.abort(); }
        var controller = new AbortController();
        configController = controller;
        return fetch(API + '/config', { credentials: 'same-origin', signal: controller.signal })
          .then(function (response) { if (!response.ok) { throw new Error('AI 配置不可用'); } return response.json(); })
          .then(function (value) { if (configController === controller) { config = value; } })
          .catch(function () { if (configController === controller) { config = { enabled: false, available: false }; } });
      }
      function execute(action, state) {
        var mode = modes[action];
        if (!mode || !state.selection) { options.notify('请先选中文字'); return; }
        if (state.selection.length > (config.maxInputCharacters || 3000)) { options.notify('选区过长，请缩短后重试'); return; }
        var panel = options.panels.open(labels[mode], stop);
        var excerpt = document.createElement('blockquote');
        excerpt.textContent = state.selection;
        var result = document.createElement('div');
        result.className = 'right-menu-ai-result';
        result.setAttribute('aria-live', 'polite');
        panel.content.append(excerpt, result);
        var stopButton = panel.button('停止生成', function () { stop(); stopButton.disabled = true; retry.disabled = false; panel.status('已停止生成'); });
        var retry = panel.button('重新生成', generate);
        var copy = panel.button('复制结果', function () { options.copyText(result.textContent).then(function (copied) { panel.status(copied ? '结果已复制' : '复制失败'); }); });
        copy.disabled = true;
        var loginButton = null;
        async function generate() {
          stop();
          var generation = sequence;
          var controller = new AbortController();
          requestController = controller;
          var output = '';
          if (loginButton) { loginButton.hidden = true; }
          result.textContent = '';
          retry.disabled = true;
          stopButton.disabled = false;
          copy.disabled = true;
          panel.status('正在生成；仅将选区发送给站长配置的模型。结果由 AI 生成，请结合原文判断。');
          var reader;
          var complete = false;
          var timer = window.setTimeout(function () { controller.abort(); }, 65000);
          try {
            var response = await fetch(API + '/explain', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', Accept: 'application/x-ndjson' }, body: JSON.stringify({ mode: mode, text: state.selection }), signal: controller.signal });
            if (generation !== sequence) { return; }
            if (!response.ok) {
              var error = await response.json().catch(function () { return {}; });
              if (generation !== sequence) { return; }
              if (response.status === 401) {
                if (!loginButton) {
                  loginButton = panel.button('登录后使用', function () { window.location.href = '/login?redirect_uri=' + encodeURIComponent(window.location.pathname + window.location.search + window.location.hash); });
                }
                loginButton.hidden = false;
              }
              throw new Error(error.message || error.detail || 'AI 暂不可用，请稍后重试');
            }
            if (!response.body) { throw new Error('浏览器不支持流式读取'); }
            reader = response.body.getReader();
            var decoder = new TextDecoder();
            var buffer = '';
            function consume(line) {
              if (!line.trim()) { return; }
              var chunk = JSON.parse(line);
              if (chunk.type === 'error') { throw new Error(chunk.text || '生成失败'); }
              if (chunk.type === 'done') { complete = true; return; }
              if (chunk.type !== 'delta' || typeof chunk.text !== 'string') { throw new Error('AI 响应格式错误'); }
              output += chunk.text;
              if (output.length > 64000) { throw new Error('AI 输出过长，已停止'); }
              result.textContent = output;
              copy.disabled = !output;
            }
            while (generation === sequence) {
              var next = await reader.read();
              // Fetch/reader cancellation can race with a buffered chunk or a retry.
              if (generation !== sequence) { return; }
              buffer += decoder.decode(next.value || new Uint8Array(), { stream: !next.done });
              if (buffer.length > 128000) { throw new Error('AI 响应格式错误'); }
              var lines = buffer.split('\n');
              buffer = lines.pop();
              lines.forEach(consume);
              if (next.done) { if (buffer.trim()) { consume(buffer); } break; }
            }
            if (generation !== sequence) { return; }
            if (!complete) { throw new Error('连接中断，结果可能不完整，请重试'); }
            if (!output) { throw new Error('模型没有返回文字，请重试或联系站长'); }
            panel.status('生成完成 · AI 结果仅供阅读参考');
          } catch (error) {
            if (generation === sequence) { panel.status(error.name === 'AbortError' ? '生成超时或已停止，请重试' : error.message); }
          } finally {
            window.clearTimeout(timer);
            if (reader) { await reader.cancel().catch(function () {}); }
            controller.abort();
            if (generation === sequence) { requestController = null; retry.disabled = false; stopButton.disabled = true; }
          }
        }
        generate();
      }
      return {
        refresh: refresh,
        canShow: function (action, state) { return !!(modes[action] && config.enabled && config.available && state.selection); },
        execute: execute,
        destroy: function () { stop(); if (configController) { configController.abort(); } },
      };
    },
  };
})();
