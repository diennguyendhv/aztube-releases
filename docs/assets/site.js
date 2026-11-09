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
    '<a href="mailto:diennguyendhv@gmail.com">Liên hệ</a>' +
    "</nav></div>";
  document.body.appendChild(footer);

  loadDownloadCount();
})();

// Download counter: sums GitHub's own download_count for every .apk asset
// across all releases, so it counts both clicks here and direct downloads
// on GitHub. Cached for 10 minutes per visitor to stay well inside
// GitHub's unauthenticated API limit (60 requests/hour per IP).
function loadDownloadCount() {
  var targets = document.querySelectorAll("[data-download-count]");
  if (!targets.length) return;

  var CACHE_KEY = "aztube-download-count";
  var CACHE_MS = 10 * 60 * 1000;

  function show(n) {
    var text = n.toLocaleString("vi-VN");
    targets.forEach(function (el) {
      el.textContent = text;
      var box = el.closest(".download-stat");
      if (box) box.classList.add("ready");
    });
  }

  // Count the visitor's own click right away so the number feels live.
  document.querySelectorAll('a[href*="/releases/download/"][href$=".apk"]').forEach(function (a) {
    a.addEventListener("click", function () {
      targets.forEach(function (el) {
        var n = parseInt(el.textContent.replace(/\D/g, ""), 10);
        if (!isNaN(n)) el.textContent = (n + 1).toLocaleString("vi-VN");
      });
      try { localStorage.removeItem(CACHE_KEY); } catch (e) {}
    });
  });

  try {
    var cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    if (cached && Date.now() - cached.at < CACHE_MS) { show(cached.n); return; }
  } catch (e) { /* ignore bad cache */ }

  fetch("https://api.github.com/repos/diennguyendhv/aztube-releases/releases?per_page=100")
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (releases) {
      var total = 0;
      releases.forEach(function (rel) {
        (rel.assets || []).forEach(function (a) {
          if (/\.apk$/i.test(a.name)) total += a.download_count || 0;
        });
      });
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ n: total, at: Date.now() })); } catch (e) {}
      show(total);
    })
    .catch(function () {
      // Counter is optional — on any failure just leave it hidden.
    });
}
