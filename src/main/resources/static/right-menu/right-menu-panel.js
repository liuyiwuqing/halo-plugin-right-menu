(function () {
  'use strict';

  // Each runtime owns one panel manager so PJAX and plugin reload can dispose it.
  window.RightMenuPanel = {
    create: function () {
      var active = null;
      function close() {
        if (!active) { return; }
        var panel = active;
        active = null;
        panel.onClose();
        panel.dialog.remove();
        if (panel.returnFocus && panel.returnFocus.isConnected) {
          panel.returnFocus.focus({ preventScroll: true });
        }
      }
      function open(title, onClose) {
        close();
        var dialog = document.createElement('dialog');
        dialog.className = 'right-menu-panel';
        dialog.setAttribute('aria-label', title);
        var heading = document.createElement('h2');
        heading.textContent = title;
        var dismiss = document.createElement('button');
        dismiss.type = 'button';
        dismiss.className = 'right-menu-panel-close';
        dismiss.textContent = '关闭';
        dismiss.addEventListener('click', close);
        var header = document.createElement('header');
        header.append(heading, dismiss);
        var content = document.createElement('div');
        content.className = 'right-menu-panel-content';
        var status = document.createElement('p');
        status.className = 'right-menu-panel-status';
        status.setAttribute('role', 'status');
        var footer = document.createElement('footer');
        dialog.append(header, content, status, footer);
        dialog.addEventListener('cancel', function (event) { event.preventDefault(); close(); });
        dialog.addEventListener('click', function (event) { if (event.target === dialog) { close(); } });
        active = { dialog: dialog, returnFocus: document.activeElement, onClose: onClose || function () {} };
        document.body.appendChild(dialog);
        if (typeof dialog.showModal === 'function') { dialog.showModal(); }
        else { dialog.setAttribute('open', ''); dismiss.focus(); }
        return {
          content: content,
          footer: footer,
          status: function (text) { status.textContent = text; },
          button: function (label, callback) {
            var button = document.createElement('button');
            button.type = 'button';
            button.textContent = label;
            button.addEventListener('click', callback);
            footer.appendChild(button);
            return button;
          },
        };
      }
      return { open: open, close: close, destroy: close };
    },
  };
})();
