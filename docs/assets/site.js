// Shared header, "other products" block and footer for every page, so they live in one place.
var RELEASES = "https://github.com/diennguyendhv/aztube-releases/releases";

(function () {
  var page = document.body.getAttribute("data-page") || "";
  var links = [
    ["", "home", "Trang chủ"],
    ["huong-dan.html", "guide", "Hướng dẫn"],
    ["quyen-rieng-tu.html", "privacy", "Quyền riêng tư"],
    ["phien-ban.html", "releases", "Phiên bản"],
    ["dieu-khoan.html", "terms", "Điều khoản"]
  ];
  var nav = links.map(function (l) {
    return '<a href="' + (l[0] || "./") + '"' + (l[1] === page ? ' class="active"' : "") + ">" + l[2] + "</a>";
  }).join("");

  var header = document.createElement("header");
  header.className = "site";
  header.innerHTML =
    '<div class="wrap">' +
    '<a class="brand" href="./"><img src="assets/icon.png" alt="">AZ Tube</a>' +
    '<a class="byline" href="https://diennguyenaz.com">by Điền Nguyễn AZ</a>' +
    '<button class="menu-toggle" aria-label="Menu">☰</button>' +
    '<nav class="main">' + nav + "</nav>" +
    "</div>";
  document.body.insertBefore(header, document.body.firstChild);
  header.querySelector(".menu-toggle").addEventListener("click", function () {
    header.querySelector("nav.main").classList.toggle("open");
  });

  var products = [
    ["https://diennguyendhv.github.io/aztube-releases/", "▶️", "AZ Tube", "Xem video không quảng cáo, phát nền, chỉ nghe âm thanh trên Android. Bạn đang ở đây.", true],
    ["https://applock.diennguyenaz.com", "📱", "AppLock", "Khóa ứng dụng trên Android bằng mã PIN. Miễn phí, không quảng cáo."],
    ["https://lockpc.diennguyenaz.com", "🔒", "LockPC", "Khóa thư mục và chặn ứng dụng trên Windows bằng một mật khẩu."],
    ["https://vinhaminh.diennguyenaz.com", "💰", "Ví Nhà Mình", "Sổ thu chi cho cá nhân và gia đình trên Android, vợ chồng dùng chung một ví."],
    ["https://diennguyenaz.com", "🎓", "Điền Nguyễn AZ", "Tin học văn phòng TP Vinh: học Word, Excel, PowerPoint thực hành, trực tiếp hoặc online."]
  ];
  var family = document.createElement("aside");
  family.className = "family";
  family.setAttribute("aria-labelledby", "family-title");
  family.innerHTML =
    '<div class="wrap"><h2 id="family-title">Sản phẩm của Điền Nguyễn AZ</h2><div class="family-grid">' +
    products.map(function (p) {
      return '<a class="family-card' + (p[4] ? ' current" aria-current="page' : "") + '" href="' + p[0] + '">' +
        '<span class="ico">' + p[1] + "</span><b>" + p[2] + "</b><span>" + p[3] + "</span><em>" + p[0].replace("https://", "").replace(/\/$/, "") + "</em></a>";
    }).join("") +
    "</div></div>";
  document.body.appendChild(family);

  var footer = document.createElement("footer");
  footer.className = "site";
  footer.innerHTML =
    '<div class="wrap">' +
    '<div>© 2026 <a href="https://diennguyenaz.com">Điền Nguyễn AZ</a> · AZ Tube — xem video không quảng cáo trên Android<br>' +
    '<small>AZ Tube là ứng dụng độc lập, không liên kết với YouTube hay Google.</small></div>' +
    "<nav>" +
    '<a href="quyen-rieng-tu.html">Chính sách quyền riêng tư</a>' +
    '<a href="dieu-khoan.html">Điều khoản</a>' +
    '<a href="' + RELEASES + '" rel="noopener">GitHub Releases</a>' +
    '<a href="https://github.com/diennguyendhv/AZ-Tube" rel="noopener">Mã nguồn (GPL-3.0)</a>' +
    '<a href="giay-phep.html">Giấy phép</a>' +
    '<a href="mailto:diennguyendhv@gmail.com">Liên hệ</a>' +
    "</nav></div>";
  document.body.appendChild(footer);

  loadReleases();
})();


// Everything version-specific on the site comes from GitHub Releases, so
// publishing a release is enough: no page needs editing afterwards.
// The HTML keeps the last known values as a fallback if GitHub can't be reached.
//   data-latest="version|file|size|sha"  → text of the newest release
//   data-latest-href="apk|sha256|source" → link of the newest release
//   data-download-count                  → total .apk downloads, all releases
//   #release-history                     → adds a section for each release not written there yet
//   [data-release-sources]               → source links for every release
// One API call, cached 10 minutes per visitor (GitHub allows 60/hour per IP).
var SOURCE = "https://github.com/diennguyendhv/AZ-Tube/tree/";

function loadReleases() {
  var CACHE_KEY = "aztube-releases-v2";
  var CACHE_MS = 10 * 60 * 1000;

  try {
    var cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    if (cached && Date.now() - cached.at < CACHE_MS && cached.list && cached.list.length) {
      applyReleases(cached.list);
      return;
    }
  } catch (e) { /* ignore bad cache */ }

  fetch("https://api.github.com/repos/diennguyendhv/aztube-releases/releases?per_page=100")
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (releases) {
      var list = releases.filter(function (r) { return !r.draft && !r.prerelease; }).map(function (r) {
        var apk = (r.assets || []).filter(function (a) { return /\.apk$/i.test(a.name); })[0];
        return {
          tag: r.tag_name,
          version: r.tag_name.replace(/^v/, ""),
          body: r.body || "",
          downloads: (r.assets || []).reduce(function (n, a) { return n + (/\.apk$/i.test(a.name) ? a.download_count || 0 : 0); }, 0),
          apk: apk ? { name: apk.name, size: apk.size, url: apk.browser_download_url } : null
        };
      }).filter(function (r) { return r.apk; });
      if (!list.length) return;
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ list: list, at: Date.now() })); } catch (e) {}
      applyReleases(list);
    })
    .catch(function () { /* keep the built-in values */ });
}

function applyReleases(list) {
  var latest = list[0];
  var sha = (latest.body.match(/SHA256:\s*`?([0-9A-F]{64})/i) || [])[1];
  var text = {
    version: latest.version,
    file: latest.apk.name,
    size: (latest.apk.size / 1e6).toLocaleString("vi-VN", { maximumFractionDigits: 1 }) + " MB",
    sha: sha ? sha.toUpperCase() : null
  };
  var href = {
    apk: latest.apk.url,
    sha256: latest.apk.url + ".sha256",
    source: SOURCE + latest.tag
  };
  document.querySelectorAll("[data-latest]").forEach(function (el) {
    var v = text[el.getAttribute("data-latest")];
    if (v) el.textContent = v;
  });
  document.querySelectorAll("[data-latest-href]").forEach(function (el) {
    var v = href[el.getAttribute("data-latest-href")];
    if (v) el.href = v;
  });

  showDownloadCount(list.reduce(function (n, r) { return n + r.downloads; }, 0));

  document.querySelectorAll("[data-release-sources]").forEach(function (el) {
    el.innerHTML = list.map(function (r) {
      return '<a href="' + SOURCE + esc(r.tag) + '">' + esc(r.tag) + "</a>";
    }).join(" · ");
  });

  var history = document.getElementById("release-history");
  if (history) addHistory(history, list);
}

function addHistory(box, list) {
  var first = box.querySelector("h2[id]");
  list.forEach(function (r, i) {
    var id = r.tag.replace(/\./g, "-");
    var section = document.getElementById(id);
    if (!section) {
      var wrap = document.createElement("div");
      wrap.innerHTML = '<h2 id="' + esc(id) + '">' + esc(r.version) + "</h2>" + renderNotes(r.body);
      while (wrap.firstChild) box.insertBefore(wrap.firstChild, first);
      section = document.getElementById(id);
    }
    // Older releases get their own download line; the newest one has the big box above.
    if (i > 0 && !box.querySelector('a[href*="/download/' + r.tag + '/"]')) {
      var p = document.createElement("p");
      p.innerHTML = '<a href="' + esc(r.apk.url) + '">Tải ' + esc(r.version) + "</a> · " +
        '<a href="' + SOURCE + esc(r.tag) + '">Mã nguồn ' + esc(r.version) + "</a>";
      section.parentNode.insertBefore(p, section.nextSibling);
    }
  });
}

// Release notes are simple Markdown: **Heading** lines, "- " bullets, `code`, bare links.
// Same cut as the app: drop the "**AZ Tube x.y**" title and everything from "**Thông tin".
function renderNotes(body) {
  var lines = body.replace(/\r/g, "").split("\n");
  var stop = lines.findIndex(function (l) { return /^\*\*Thông tin/.test(l.trim()); });
  if (stop >= 0) lines = lines.slice(0, stop);
  var html = "", inList = false;
  function close() { if (inList) { html += "</ul>"; inList = false; } }
  lines.forEach(function (raw) {
    var l = raw.trim();
    if (!l || /^\*\*AZ Tube/.test(l)) { close(); return; }
    var h = l.match(/^\*\*(.+)\*\*$/);
    if (h) { close(); html += "<h3>" + inline(h[1]) + "</h3>"; return; }
    if (/^[-*] /.test(l)) {
      if (!inList) { html += "<ul>"; inList = true; }
      html += "<li>" + inline(l.slice(2)) + "</li>";
      return;
    }
    close();
    html += "<p>" + inline(l) + "</p>";
  });
  close();
  return html;
}

function inline(s) {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/(https:\/\/[^\s<]+)/g, '<a href="$1">$1</a>');
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
  });
}

function showDownloadCount(n) {
  var targets = document.querySelectorAll("[data-download-count]");
  if (!targets.length) return;
  var text = n.toLocaleString("vi-VN");
  targets.forEach(function (el) {
    el.textContent = text;
    var box = el.closest(".download-stat");
    if (box) box.classList.add("ready");
  });
  // Count the visitor's own click right away so the number feels live.
  document.querySelectorAll('a[href*="/releases/download/"][href$=".apk"]').forEach(function (a) {
    if (a.dataset.counted) return;
    a.dataset.counted = "1";
    a.addEventListener("click", function () {
      targets.forEach(function (el) {
        var c = parseInt(el.textContent.replace(/\D/g, ""), 10);
        if (!isNaN(c)) el.textContent = (c + 1).toLocaleString("vi-VN");
      });
      try { localStorage.removeItem("aztube-releases-v2"); } catch (e) {}
    });
  });
}
