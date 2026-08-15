(function () {
  'use strict';

  var LANG_KEY = 'nova-site-lang';
  var THEME_KEY = 'nova-site-theme';
  var RELEASE_URL = 'https://github.com/JasonSun2009CN/Nova/releases/latest';

  var I18N = {
    zh: {
      'nav.features': '功能',
      'nav.download': '下载',
      'nav.about': '关于',
      'nav.github': 'GitHub',
      'hero.eyebrow': '专注 · 就是星际航行',
      'hero.title': '让每一次专注，<br/><span class="gold">都成为一次星际航行</span>',
      'hero.sub':
        '设定专注时长，你的飞船就驶向一颗真实的恒星。相对论时间膨胀把专注的每一分钟，变成跨越光年的旅程。',
      'hero.ctaDownload': '下载 Nova',
      'hero.ctaWeb': '在线使用',
      'hero.m1': '<b>17,789</b> 颗真实恒星',
      'hero.m2': '<b>4.246 ly</b> 到比邻星',
      'hero.m3': '<b>γ ×91,000</b> 时间膨胀',
      'features.eyebrow': '为什么是 Nova',
      'features.title': '把番茄钟，变成一场远征',
      'features.sub':
        '不是又一个计时器。Nova 用真实的宇宙结构，让每一次专注都有方向、有距离、有回响。',
      'f1.title': '真实星图',
      'f1.desc':
        '17,789 颗真实恒星与 34 个著名星云。目的地是比邻星、天狼星、织女星，不是抽象的数字。',
      'f2.title': '相对论时间膨胀',
      'f2.desc':
        '速度越接近光速，时间流逝越慢。你的专注分钟 × γ（洛伦兹因子），就是宇宙中真正经过的时间。',
      'f3.title': '白噪音 + 成就',
      'f3.desc':
        'Web Audio 实时合成的引擎嗡鸣与宇宙微波背景音。15 项成就，解锁更强的曲速引擎，一路开向深空。',
      'f4.title': '船长日志',
      'f4.desc':
        '专注热力图、周月柱状图、连续天数与累计光年。每一次航程都被记录，导出成你的旅行日志。',
      'dl.eyebrow': '立即开始',
      'dl.title': '下载 Nova',
      'dl.sub': '免费 · 开源 · 本地运行。选择你的平台，或直接在浏览器里使用网页版。',
      'dl.versionLabel': '最新版本',
      'dl.mac': 'macOS',
      'dl.windows': 'Windows',
      'dl.linux': 'Linux',
      'dl.web': '网页版',
      'dl.webBtn': '在线使用 · PWA',
      'dl.note': '通过 GitHub Actions 为 tag 自动构建。可在',
      'dl.note2': '查看全部安装包。',
      'about.eyebrow': '关于',
      'about.title': '一个认真做时间的应用',
      'about.body':
        'Nova 把一个简单的想法做到极致：专注计时不该是单调的倒计时，而是一次有方向的旅行。它使用真实的恒星数据、真实的相对论公式，把「我专注了 25 分钟」变成「我飞向了半人马座 α」。数据全部保存在本地，免费、开源、无需账户。项目地址：',
      'about.body2': '。',
      'footer.copy': '© 2026 · 让每一次专注都成为一次星际航行',
      'theme.toggleLight': '切换亮色主题',
      'theme.toggleDark': '切换暗色主题',
    },
    en: {
      'nav.features': 'Features',
      'nav.download': 'Download',
      'nav.about': 'About',
      'nav.github': 'GitHub',
      'hero.eyebrow': 'FOCUS · IS A VOYAGE',
      'hero.title':
        'Make every focus session<br/><span class="gold">an interstellar voyage</span>',
      'hero.sub':
        'Set a focus duration and your ship heads for a real star. Relativistic time dilation turns every focused minute into a journey measured in light-years.',
      'hero.ctaDownload': 'Download Nova',
      'hero.ctaWeb': 'Use online',
      'hero.m1': '<b>17,789</b> real stars',
      'hero.m2': '<b>4.246 ly</b> to Proxima',
      'hero.m3': '<b>γ ×91,000</b> time dilation',
      'features.eyebrow': 'Why Nova',
      'features.title': 'Turn a pomodoro into an expedition',
      'features.sub':
        'Not another timer. Nova uses real cosmic structure so every focus session has a direction, a distance, and an echo.',
      'f1.title': 'Real star map',
      'f1.desc':
        '17,789 real stars and 34 famous nebulae. Your destinations are Proxima, Sirius, Vega — not abstract numbers.',
      'f2.title': 'Relativistic time dilation',
      'f2.desc':
        'The closer to light speed, the slower time passes. Your focus minutes × γ (Lorentz factor) is the time that truly passes in the universe.',
      'f3.title': 'White noise + achievements',
      'f3.desc':
        'Real-time Web Audio engine hum and cosmic microwave background. 15 achievements unlock stronger warp engines.',
      'f4.title': "Captain's log",
      'f4.desc':
        'Focus heatmap, weekly and monthly charts, streaks and cumulative light-years. Every voyage is recorded and exported as a travel log.',
      'dl.eyebrow': 'Get started',
      'dl.title': 'Download Nova',
      'dl.sub':
        'Free · open source · runs locally. Pick your platform, or use the web app right in your browser.',
      'dl.versionLabel': 'Latest version',
      'dl.mac': 'macOS',
      'dl.windows': 'Windows',
      'dl.linux': 'Linux',
      'dl.web': 'Web',
      'dl.webBtn': 'Use online · PWA',
      'dl.note': 'Built automatically for every tag via GitHub Actions. See all packages on',
      'dl.note2': '.',
      'about.eyebrow': 'About',
      'about.title': 'An app that takes time seriously',
      'about.body':
        "Nova pushes one simple idea to its limit: a focus timer shouldn't be a monotonous countdown — it should be a voyage with a direction. It uses real star data and real relativity equations to turn \"I focused for 25 minutes\" into \"I reached Alpha Centauri.\" Everything stays on your device: free, open source, no account. Project:",
      'about.body2': '.',
      'footer.copy': '© 2026 · Make every focus session an interstellar voyage',
      'theme.toggleLight': 'Switch to light theme',
      'theme.toggleDark': 'Switch to dark theme',
    },
  };

  function detectLang() {
    var saved = localStorage.getItem(LANG_KEY);
    if (saved === 'zh' || saved === 'en') return saved;
    return (navigator.language || 'zh').toLowerCase().indexOf('zh') === 0 ? 'zh' : 'en';
  }

  var lang = detectLang();
  var theme = localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark';

  function applyTheme(t) {
    document.documentElement.dataset.theme = t;
    var isDark = t === 'dark';
    var toggle = document.getElementById('theme-toggle');
    toggle.setAttribute(
      'aria-label',
      I18N[lang][isDark ? 'theme.toggleLight' : 'theme.toggleDark'],
    );
    document.getElementById('icon-sun').style.display = isDark ? 'block' : 'none';
    document.getElementById('icon-moon').style.display = isDark ? 'none' : 'block';
  }

  function applyLang(l) {
    lang = l;
    document.documentElement.lang = l === 'zh' ? 'zh-CN' : 'en';
    document.querySelectorAll('[data-i18n], [data-i18n-html]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-html') || el.getAttribute('data-i18n');
      var text = I18N[l][key];
      if (text === undefined) return;
      if (el.hasAttribute('data-i18n-html')) {
        el.innerHTML = text;
      } else {
        el.textContent = text;
      }
    });
    var lt = document.getElementById('lang-toggle');
    var next = l === 'zh' ? 'en' : 'zh';
    lt.textContent = next === 'zh' ? '中' : 'EN';
    lt.setAttribute('aria-label', next === 'zh' ? '中文' : 'English');
  }

  document.getElementById('theme-toggle').addEventListener('click', function () {
    theme = theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, theme);
    applyTheme(theme);
  });

  document.getElementById('lang-toggle').addEventListener('click', function () {
    var next = lang === 'zh' ? 'en' : 'zh';
    localStorage.setItem(LANG_KEY, next);
    applyLang(next);
  });

  function buildStarfield() {
    var field = document.getElementById('starfield');
    var count = window.matchMedia('(max-width: 640px)').matches ? 40 : 80;
    for (var i = 0; i < count; i++) {
      var dot = document.createElement('span');
      dot.className = 'dot';
      var size = 1 + Math.random() * 2.2;
      dot.style.width = size + 'px';
      dot.style.height = size + 'px';
      dot.style.left = Math.random() * 100 + '%';
      dot.style.top = Math.random() * 100 + '%';
      dot.style.animationDelay = Math.random() * 4 + 's';
      dot.style.opacity = (0.25 + Math.random() * 0.6).toFixed(2);
      field.appendChild(dot);
    }
  }

  function setVersion(v) {
    document.querySelectorAll('[data-version]').forEach(function (el) {
      el.textContent = v;
    });
  }

  function fillFromManifest() {
    fetch('./latest.json')
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (m) {
        if (m && m.version) setVersion(m.version);
      })
      .catch(function () {});
  }

  function setHref(attr, url) {
    var el = document.querySelector('[' + attr + ']');
    if (el && url) el.href = url;
  }

  function fillDownloads() {
    fetch('https://api.github.com/repos/JasonSun2009CN/Nova/releases/latest', {
      headers: { Accept: 'application/vnd.github+json' },
    })
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (release) {
        if (!release || !release.assets) throw new Error('no release');
        var assets = release.assets;
        function assetUrl(pred) {
          var match = assets.filter(pred)[0];
          return match ? match.browser_download_url : null;
        }
        var isDmg = function (n) {
          return /\.dmg$/i.test(n);
        };
        var macArm =
          assetUrl(function (a) {
            return isDmg(a.name) && /aarch64|arm64/i.test(a.name);
          }) ||
          assetUrl(isDmg);
        var macIntel =
          assetUrl(function (a) {
            return isDmg(a.name) && /x86_64|x64/i.test(a.name) && !/aarch64|arm64/i.test(a.name);
          }) ||
          assetUrl(isDmg);
        var win =
          assetUrl(function (a) {
            return /\.exe$/i.test(a.name) && /setup|installer/i.test(a.name);
          }) ||
          assetUrl(function (a) {
            return /\.exe$/i.test(a.name);
          });
        var appimage = assetUrl(function (a) {
          return /\.appimage$/i.test(a.name);
        });
        var deb = assetUrl(function (a) {
          return /\.deb$/i.test(a.name);
        });
        setHref('data-mac-arm', macArm);
        setHref('data-mac-intel', macIntel);
        setHref('data-win', win);
        setHref('data-linux-appimage', appimage);
        setHref('data-linux-deb', deb);
      })
      .catch(function () {
        // 保持默认链接：指向 GitHub Releases 页面
      });
  }

  applyTheme(theme);
  applyLang(lang);
  buildStarfield();
  fillFromManifest();
  fillDownloads();
})();
