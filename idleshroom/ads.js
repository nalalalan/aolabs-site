(function () {
  "use strict";

  const config = window.MUSHROOM_BOOP_ADS || {};
  const params = new URLSearchParams(window.location.search);
  const debug = config.debugPlaceholders || params.has("debugAds");
  const client = String(config.adsenseClient || "").trim();
  const slots = config.slots || {};

  const adNodes = Array.from(document.querySelectorAll(".ad-slot"));

  if (!client) {
    adNodes.forEach(node => {
      if (debug) {
        node.dataset.state = "debug";
        node.textContent = "sponsor slot";
      } else {
        node.dataset.state = "off";
      }
    });
    return;
  }

  const script = document.createElement("script");
  script.async = true;
  script.crossOrigin = "anonymous";
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
  document.head.appendChild(script);

  adNodes.forEach(node => {
    const unit = node.dataset.adUnit;
    const slot = String(slots[unit] || "").trim();
    if (!slot) {
      node.dataset.state = "off";
      return;
    }
    node.dataset.state = "live";
    node.innerHTML = "";
    const ins = document.createElement("ins");
    ins.className = "adsbygoogle";
    ins.style.display = "block";
    ins.dataset.adClient = client;
    ins.dataset.adSlot = slot;
    ins.dataset.adFormat = "auto";
    ins.dataset.fullWidthResponsive = "true";
    node.appendChild(ins);
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      node.dataset.state = "debug";
      node.textContent = "ad load pending";
    }
  });
})();
