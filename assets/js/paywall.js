/**
 * 红夜列车 · 自愿支持系统 v1.0
 * 继承《松涛粮站》的前端 localStorage/sessionStorage/cookie 流程，
 * 调整为本作的文案、存储键与“仅自动弹出一次”规则。
 */
const Paywall = {
  STORAGE_KEY: '_hongye_train_support',
  SESSION_KEY: '_hongye_train_session',
  COOKIE_KEY: '_hongye_pay_flag',
  AUTO_SEEN_KEY: '_hongye_pay_auto_seen_v1',
  hasPaid() {
    try {
      const ls = localStorage.getItem(this.STORAGE_KEY);
      const ss = sessionStorage.getItem(this.SESSION_KEY);
      const cookie = this._getCookie(this.COOKIE_KEY);
      return !!(ls || ss || cookie);
    } catch (e) {
      return !!this._getCookie(this.COOKIE_KEY);
    }
  },
  markPaid() {
    const token = this._generateToken();
    try { localStorage.setItem(this.STORAGE_KEY, token); } catch (e) {}
    try { sessionStorage.setItem(this.SESSION_KEY, token); } catch (e) {}
    this._setCookie(this.COOKIE_KEY, token, 365);
  },
  _generateToken() {
    const ts = Date.now();
    const rand = Math.random().toString(36).substring(2, 10);
    try { return btoa(`${ts}_${rand}_k417_support`); }
    catch (e) { return `${ts}_${rand}_k417_support`; }
  },
  _setCookie(name, value, days) {
    try {
      const d = new Date();
      d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
      document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/;SameSite=Lax`;
    } catch (e) {}
  },
  _getCookie(name) {
    try {
      const cname = name + '=';
      const ca = document.cookie.split(';');
      for (let i = 0; i < ca.length; i++) {
        const c = ca[i].trim();
        if (c.indexOf(cname) === 0) return c.substring(cname.length);
      }
    } catch (e) {}
    return '';
  },
  _config(config) {
    return Object.assign({
      qrCode: 'assets/images/paycode.png',
      price: '1元',
      title: '支持《红夜列车》',
      studio: 'abc studio'
    }, config || {});
  },
  show(config) {
    if (this.hasPaid()) {
      this._showThanks('已经记录过你的支持，感谢你陪K417走到这里。');
      return false;
    }
    const cfg = this._config(config);
    const overlay = document.getElementById('paywall-overlay');
    if (!overlay) this._createOverlay(cfg);
    else {
      overlay.style.display = 'flex';
      overlay.classList.remove('paywall-closing', 'paywall-show');
      requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('paywall-show')));
    }
    return true;
  },
  autoShow(config, delay = 1200) {
    let seen = false;
    try { seen = localStorage.getItem(this.AUTO_SEEN_KEY) === '1'; } catch (e) {}
    if (seen || this.hasPaid()) return false;
    try { localStorage.setItem(this.AUTO_SEEN_KEY, '1'); } catch (e) {}
    window.setTimeout(() => this.show(config), Math.max(0, delay));
    return true;
  },
  hide() {
    const overlay = document.getElementById('paywall-overlay');
    if (!overlay) return;
    overlay.classList.add('paywall-closing');
    overlay.classList.remove('paywall-show');
    window.setTimeout(() => {
      overlay.style.display = 'none';
      overlay.classList.remove('paywall-closing');
    }, 400);
  },
  _onSupport() {
    this.markPaid();
    this.hide();
    this._showThanks('感谢你的支持！K417继续向天亮驶去。');
  },
  _showThanks(text) {
    const old = document.querySelector('.paywall-toast');
    if (old) old.remove();
    const toast = document.createElement('div');
    toast.className = 'paywall-toast';
    toast.textContent = text || '感谢你的支持！';
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 50);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  },
  _animateIn() {
    const overlay = document.getElementById('paywall-overlay');
    if (overlay) requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('paywall-show')));
  },
  _createOverlay(cfg) {
    const html = `
      <div class="paywall-overlay" id="paywall-overlay" role="dialog" aria-modal="true" aria-label="支持作品">
        <div class="paywall-card">
          <button class="paywall-close" onclick="Paywall.hide()" title="关闭" aria-label="关闭">&times;</button>
          <div class="paywall-card-inner">
            <div class="paywall-header">
              <div class="paywall-title-row">
                <span class="paywall-heart">♡</span>
                <span class="paywall-title">${cfg.title}</span>
                <span class="paywall-heart">♡</span>
              </div>
              <div class="paywall-subtitle">${cfg.price} 自愿打赏 · 不影响任何游戏内容</div>
            </div>
            <div class="paywall-body">
              <div class="paywall-qr-wrapper">
                <img src="${cfg.qrCode}" alt="收款码" class="paywall-qr-img" />
                <div class="paywall-qr-glow"></div>
              </div>
              <div class="paywall-qr-tip">请用 <strong style="color:#1677ff;">某宝</strong> 扫码自愿支持 ${cfg.price}</div>
              <div class="paywall-message">
                <p class="paywall-msg-warm">你好，我是这部网页解谜的独立开发者。</p>
                <p class="paywall-msg-body">
                  K417上的人物、旧案、证物和推理链花了很多时间反复调整。<br>
                  如果这趟暴雪夜车让你愿意多停留一会儿，支持 <strong>1元</strong> 就已经很感谢。<br>
                  不支持也可以完整游玩，不会锁章节、线索或结局。
                </p>
                <p class="paywall-msg-cute">1块钱改变不了列车时刻，但能给下一份封存档案多亮一盏灯。</p>
                <p class="paywall-msg-warm2">自动提示只出现这一次；之后如愿意支持，可随时点击页面上方“支持作品”。</p>
              </div>
            </div>
            <div class="paywall-footer">
              <div class="paywall-hint"><span class="paywall-hint-icon">💡</span><span>“已完成支持”只用于在本浏览器记录状态，不会上传个人信息。</span></div>
              <div class="paywall-btns">
                <button class="paywall-btn paywall-btn-support" onclick="Paywall._onSupport()">已完成支持 ♡</button>
                <button class="paywall-btn paywall-btn-later" onclick="Paywall.hide()">先继续查案</button>
              </div>
            </div>
            <div class="paywall-studio">${cfg.studio}</div>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    this._animateIn();
  }
};
window.Paywall = Paywall;
