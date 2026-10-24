/* ==========================================================================
   FUSION — MAIN (page wiring)
   Detects which containers exist on the current page and renders them from
   FusionAPI, wires Add to Cart / Wishlist / filters / search / sort, and
   drives the scroll-reveal animation observer.
   ========================================================================== */

(function () {
  "use strict";

  document.documentElement.classList.add("js");

  /* ---------- SMALL HELPERS ---------- */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function qsParam(name) { return new URLSearchParams(window.location.search).get(name); }

  function checkBackgroundImage(el, property) {
    var value = el.style.getPropertyValue(property);
    var match = value.match(/url\((?:"|')?(.*?)(?:"|')?\)/);
    if (!match) return;
    var probe = new Image();
    probe.onerror = function () {
      el.style.setProperty(property, "none");
      if (property === "--product-img-1") {
        var image = el.querySelector(".product-card__image");
        if (image) image.style.display = "none";
      }
    };
    probe.src = new URL(match[1], document.baseURI).href;
  }

  function initProductImageFallbacks() {
    function inspect(node) {
      if (!node || node.nodeType !== 1) return;
      var selector = ".product-card__photo, .gallery, .icon-badge--photo";
      var targets = (node.matches(selector) ? [node] : []).concat($all(selector, node));
      targets.forEach(function (el) {
        if (el.matches(".product-card__photo, .gallery")) {
          ["--product-img-1", "--product-img-2"].forEach(function (property, index) {
            checkBackgroundImage(el, property);
          });
        }
        if (el.matches(".icon-badge--photo")) {
          checkBackgroundImage(el, "background-image");
        }
      });
    }

    inspect(document.body);
    new MutationObserver(function (records) {
      records.forEach(function (record) {
        Array.prototype.forEach.call(record.addedNodes, inspect);
      });
    }).observe(document.body, { childList: true, subtree: true });
  }

  function toast(message) {
    var el = $("#fusion-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "fusion-toast";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      el.style.cssText = "position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(120%);" +
        "background:var(--gradient-primary);color:#fff;padding:0.85rem 1.6rem;border-radius:var(--radius-full);" +
        "box-shadow:var(--shadow-lg);z-index:2000;font-size:0.9rem;font-weight:600;transition:transform 0.4s cubic-bezier(.22,1,.36,1);";
      document.body.appendChild(el);
    }
    el.textContent = message;
    requestAnimationFrame(function () {
      el.style.transform = "translateX(-50%) translateY(0)";
    });
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      el.style.transform = "translateX(-50%) translateY(120%)";
    }, 2200);
  }

  /* ---------- SCROLL REVEAL ---------- */
  function initScrollReveal() {
    var targets = $all(".reveal, .reveal-stagger");
    if (!targets.length) return;
    if (!("IntersectionObserver" in window)) {
      targets.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -60px 0px" });
    targets.forEach(function (el) { observer.observe(el); });
  }

  /* ---------- STAT COUNTERS (count up when scrolled into view) ---------- */
  function initStatCounters() {
    var counters = $all("[data-counter]");
    if (!counters.length) return;

    function animate(el) {
      var target = parseFloat(el.getAttribute("data-target"));
      var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
      var suffix = el.getAttribute("data-suffix") || "";
      var duration = 1500;
      var start = null;

      function step(timestamp) {
        if (start === null) start = timestamp;
        var progress = Math.min((timestamp - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = (target * eased).toFixed(decimals) + suffix;
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    if (!("IntersectionObserver" in window)) {
      counters.forEach(animate);
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animate(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { observer.observe(el); });
  }

  

  /* ---------- NAVBAR: auto-close mobile menu on link click ---------- */
  function initNavbar() {
    var toggle = $("#nav-toggle");
    if (toggle) {
      $all(".navbar__menu a").forEach(function (link) {
        link.addEventListener("click", function () { toggle.checked = false; });
      });
    }
    initNavDropdowns();
  }

  /* ---------- NAV DROPDOWNS: tap-to-toggle fallback for touch devices ---------- */
  function initNavDropdowns() {
    var dropdowns = $all(".navbar__dropdown");
    if (!dropdowns.length) return;

    dropdowns.forEach(function (dropdown) {
      var trigger = dropdown.querySelector(":scope > a");
      if (!trigger) return;
      trigger.setAttribute("aria-haspopup", "true");
      trigger.setAttribute("aria-expanded", "false");
      trigger.addEventListener("click", function (e) {
        // Below 768px the mega-menu panel is hidden by CSS (see responsive.css) —
        // let the link navigate normally instead of trapping the tap.
        if (window.matchMedia("(max-width: 767px)").matches) return;
        var willOpen = !dropdown.classList.contains("is-open");
        e.preventDefault();
        dropdowns.forEach(function (d) {
          d.classList.remove("is-open");
          var t = d.querySelector(":scope > a");
          if (t) t.setAttribute("aria-expanded", "false");
        });
        if (willOpen) {
          dropdown.classList.add("is-open");
          trigger.setAttribute("aria-expanded", "true");
        }
      });
    });

    document.addEventListener("click", function (e) {
      if (!e.target.closest(".navbar__dropdown")) {
        dropdowns.forEach(function (d) {
          d.classList.remove("is-open");
          var t = d.querySelector(":scope > a");
          if (t) t.setAttribute("aria-expanded", "false");
        });
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        dropdowns.forEach(function (d) {
          d.classList.remove("is-open");
          var t = d.querySelector(":scope > a");
          if (t) t.setAttribute("aria-expanded", "false");
        });
      }
    });
  }

  /* ---------- QUICK VIEW MODAL ---------- */
  function ensureQuickViewDialog() {
    var dialog = $("#quick-view-dialog");
    if (dialog) return dialog;
    dialog = document.createElement("dialog");
    dialog.id = "quick-view-dialog";
    dialog.className = "quick-view-dialog";
    dialog.innerHTML =
      '<form method="dialog" class="quick-view-dialog__close"><button type="submit" class="btn btn--icon btn--ghost" aria-label="Close quick view">' +
      FusionRender.icon("close", "icon--sm") + "</button></form>" +
      '<div id="quick-view-body" class="quick-view-dialog__body"></div>';
    document.body.appendChild(dialog);
    dialog.addEventListener("click", function (e) {
      var rect = dialog.getBoundingClientRect();
      var inside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
      if (!inside) dialog.close();
    });
    return dialog;
  }

  function openQuickView(product) {
    product = FusionRender.normalizeProduct(product);
    var dialog = ensureQuickViewDialog();
    var body = $("#quick-view-body", dialog);
    body.innerHTML =
      '<div class="icon-banner icon-banner--' + product.gradient + '" style="border-radius:var(--radius-lg);">' + FusionRender.icon(product.icon, "icon--xl") + "</div>" +
      '<div class="mt-md">' +
        '<span class="product-card__category">' + product.category + "</span>" +
        "<h3>" + product.name + "</h3>" +
        "<p class='mt-sm'>" + product.description + "</p>" +
        '<div class="product-card__tags mt-sm"><span class="tag">Protein ' + product.protein + 'g</span><span class="tag">' + product.calories + ' kcal</span><span class="tag">' + product.deliveryTime + "</span></div>" +
        '<div class="flex flex--between mt-md"><span class="product-card__price" style="font-size:var(--fs-xl);">₹' + product.price + "</span>" +
        '<a href="singlepage.html?id=' + product.id + '" class="btn btn--outline btn--sm">Full Details</a></div>' +
        '<button type="button" class="btn btn--primary btn--block mt-sm" data-action="add-to-cart" data-product-id="' + product.id + '">Add To Cart</button>' +
      "</div>";
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  /* ---------- DELEGATED ACTIONS (work on every page) ---------- */
  function initGlobalActions(state) {
    document.addEventListener("click", function (e) {
      var target = e.target.closest("[data-action]");
      if (!target) return;
      var action = target.getAttribute("data-action");
      var productId = target.getAttribute("data-product-id");

      switch (action) {
        case "add-to-cart": {
          var qty = 1;
          if (target.id === "main-add-to-cart-btn") {
            var qtyOutput = $("#qty-input");
            qty = qtyOutput ? (parseInt(qtyOutput.textContent, 10) || 1) : 1;
          }
          FusionCart.addToCart(productId, qty);
          toast("Added to cart");
          if (state.onCartChange) state.onCartChange();
          break;
        }
        case "buy-now": {
          var qOut = $("#qty-input");
          FusionCart.addToCart(productId, qOut ? (parseInt(qOut.textContent, 10) || 1) : 1);
          window.location.href = "cart.html";
          break;
        }
        case "toggle-favorite": {
          var nowActive = FusionCart.toggleWishlist(productId);
          target.classList.toggle("is-active", nowActive);
          target.setAttribute("aria-pressed", nowActive ? "true" : "false");
          var svgIcon = target.querySelector("svg");
          if (svgIcon) svgIcon.classList.toggle("icon--filled", nowActive);
          toast(nowActive ? "Added to wishlist" : "Removed from wishlist");
          break;
        }
        case "quick-view": {
          FusionAPI.getProductById(productId).then(function (product) {
            if (product) openQuickView(product);
          });
          break;
        }
        case "increment-qty":
        case "decrement-qty": {
          var stepper = target.closest(".stepper");
          var output = stepper.querySelector("output");
          var cartProductId = stepper.getAttribute("data-product-id");
          if (cartProductId) {
            action === "increment-qty" ? FusionCart.incrementQty(cartProductId) : FusionCart.decrementQty(cartProductId);
            if (state.onCartQtyChange) state.onCartQtyChange();
          } else {
            var current = parseInt(output.textContent, 10) || 1;
            output.textContent = String(action === "increment-qty" ? current + 1 : Math.max(1, current - 1));
          }
          break;
        }
        case "remove-item": {
          FusionCart.removeFromCart(productId);
          toast("Item removed");
          if (state.onCartChange) state.onCartChange();
          break;
        }
        case "apply-coupon": {
          if (state.onCartChange) state.onCartChange();
          break;
        }
        case "checkout": {
          e.preventDefault();
          if (FusionCart.getCartCount() === 0) { toast("Your cart is empty"); return; }
          toast("Order placed! Redirecting…");
          FusionCart.clearCart();
          setTimeout(function () { window.location.href = "index.html"; }, 1200);
          break;
        }
        case "choose-plan": {
          toast("Plan selected — redirecting to signup");
          setTimeout(function () { window.location.href = "signup.html"; }, 900);
          break;
        }
        case "google-login":
        case "google-signup": {
          toast("Google sign-in is a UI placeholder in this demo");
          break;
        }
        case "load-more": {
          toast("You're all caught up for now");
          break;
        }
        case "read-article": {
          toast("Full article view coming soon");
          break;
        }
        case "logout": {
          window.location.href = "login.html";
          break;
        }
        default: break;
      }
    });

    document.addEventListener("submit", function (e) {
      if (e.target.id === "newsletter-form") {
        e.preventDefault();
        toast("Subscribed! Check your inbox for healthy recipes.");
        e.target.reset();
      }
      if (e.target.id === "login-form") {
        e.preventDefault();
        toast("Login successful (demo)");
      }
      if (e.target.id === "signup-form") {
        var pw = $("#signup-password", e.target);
        var cpw = $("#signup-confirm-password", e.target);
        if (pw && cpw && pw.value !== cpw.value) {
          e.preventDefault();
          toast("Passwords do not match");
          return;
        }
        e.preventDefault();
        toast("Account created (demo)");
      }
      if (e.target.id === "account-settings-form") {
        e.preventDefault();
        toast("Profile updated");
      }
    });
  }

  /* ---------- TOOLBAR (search + filter chips + sort) ---------- */
  function initToolbar(toolbarSel, onChange) {
    var toolbar = $(toolbarSel);
    if (!toolbar) return null;
    var state = { query: "", category: "all", sort: "popular" };

    toolbar.addEventListener("submit", function (e) { e.preventDefault(); });

    var searchInput = toolbar.querySelector('input[type="search"]');
    if (searchInput) {
      searchInput.addEventListener("input", function () {
        state.query = searchInput.value;
        onChange(state);
      });
    }

    $all(".filter-chip", toolbar).forEach(function (chip) {
      chip.addEventListener("click", function () {
        $all(".filter-chip", toolbar).forEach(function (c) { c.setAttribute("aria-pressed", "false"); });
        chip.setAttribute("aria-pressed", "true");
        state.category = chip.getAttribute("data-filter");
        onChange(state);
      });
    });

    var sortSelect = toolbar.querySelector("select");
    if (sortSelect) {
      sortSelect.addEventListener("change", function () {
        state.sort = sortSelect.value;
        onChange(state);
      });
    }

    return state;
  }

  /* ---------- PAGE: HOME ---------- */
  function initHome(products) {
    var specialGrid = $("#home-special-grid");
    var bestGrid = $("#home-bestsellers-grid");
    if (specialGrid) {
      var specials = products.filter(function (p) { return p.special; }).slice(0, 3);
      var filler = products.filter(function (p) { return !p.special; })[0];
      var html = specials.map(function (p, i) { return FusionRender.flipProductCard(p, { auto: i === 0 }); }).join("");
      if (filler) html += FusionRender.flipProductCard(filler, { auto: false });
      specialGrid.innerHTML = html;
    }
    if (bestGrid) {
      var best = FusionAPI.sortProducts(products, "popular").slice(0, 4);
      bestGrid.innerHTML = best.map(function (p) { return FusionRender.productCard(p, { wishlisted: FusionCart.isWishlisted(p.id), flipImages: true, extraClass: "product-card--best-seller" }); }).join("");
      bestGrid.addEventListener("click", function (event) {
        if (event.target.closest("[data-action]")) return;
        var imageLink = event.target.closest(".product-card--best-seller .product-card__link");
        if (!imageLink) return;
        event.preventDefault();
        var card = imageLink.closest(".product-card--best-seller");
        card.classList.toggle("is-image-flipped");
      });
    }
  }

  /* ---------- PAGE: CATEGORIES ---------- */
  function initCategories(products, categories) {
    var grid = $("#category-grid");
    if (!grid) return;
    grid.innerHTML = categories.map(function (cat) {
      var count = cat.isPlan
        ? (cat.slug === "weekly-plans" ? "7 Meals" : "30 Meals")
        : products.filter(function (p) { return p.categorySlug === cat.slug; }).length + " Items";
      return FusionRender.categoryCard(cat, count);
    }).join("");
  }

  /* ---------- PAGE: PRODUCTS ---------- */
  function initProducts(products) {
    var grid = $("#product-grid");
    if (!grid) return;

    function render(state) {
      var filtered = FusionAPI.filterProducts(products, state);
      if (!filtered.length) {
        grid.innerHTML = FusionRender.emptyState("No meals match your search or filters.", "products.html", "Reset");
        return;
      }
      grid.innerHTML = filtered.map(function (p) {
        return FusionRender.productCard(p, { wishlisted: FusionCart.isWishlisted(p.id) });
      }).join("");
    }

    var presetCategory = qsParam("category");
    var presetQuery = qsParam("q");
    var state = initToolbar("#product-toolbar", render) || { query: "", category: "all", sort: "popular" };

    if (presetCategory) {
      state.category = presetCategory;
      var chip = $('#category-filter [data-filter="' + presetCategory + '"]');
      if (chip) {
        $all(".filter-chip", $("#category-filter")).forEach(function (c) { c.setAttribute("aria-pressed", "false"); });
        chip.setAttribute("aria-pressed", "true");
      }
    }

    if (presetQuery) {
      state.query = presetQuery;
      var searchInput = $("#product-search");
      if (searchInput) searchInput.value = presetQuery;
    }

    render(state);
  }

  /* ---------- PAGE: NUTRITION ---------- */
  function initNutrition(products) {
    var grid = $("#nutrition-grid");
    if (!grid) return;

    function render(state) {
      var filtered = FusionAPI.filterProducts(products, state);
      grid.innerHTML = filtered.length
        ? filtered.map(function (p) { return FusionRender.nutritionCard(p); }).join("")
        : FusionRender.emptyState("No meals match your search or filters.", "nutrition.html", "Reset");
    }

    var state = initToolbar("#nutrition-toolbar", render) || { query: "", category: "all", sort: "default" };
    render(state);
  }

  /* ---------- PAGE: SINGLE PRODUCT ---------- */
  function initSinglePage(products) {
    if (!document.getElementById("product-info")) return;
    var id = qsParam("id") || products[0].id;

    FusionAPI.getProductById(id).then(function (product) {
      if (!product) { product = products[0]; }
      product = FusionRender.normalizeProduct(product);
      document.title = product.name + " | FUSION — A Healthy Lifestyle";

      $("#breadcrumb-current").textContent = product.name;
      $("#product-category-label").textContent = product.category;
      $("#product-title").textContent = product.name;
      $("#product-rating").innerHTML = FusionRender.icon("star", "icon--xs icon--filled") + " " + product.rating + ' <span class="rating__count">(' + product.ratingCount + " reviews)</span>";
      $("#product-description").textContent = product.description;
      $("#product-price").textContent = "₹" + product.price;
      $("#product-delivery").textContent = "Delivery in " + product.deliveryTime;
      var fallbackPrimary = FusionRender.productImageFor(product, 0);
      var fallbackSecondary = FusionRender.productImageFor(product, 1);
      var hasPhoto = !!(product.image1 || product.image2 || product.categorySlug);
      var gallery = $("#product-gallery");
      var mainFrame = $("#gallery-main-frame");
      var mainIcon = $("#gallery-icon-main");
      var thumb1 = $("#gallery-thumb-1");
      var thumb2 = $("#gallery-thumb-2");

      gallery.classList.toggle("gallery--icon-only", !hasPhoto);
      mainFrame.className = "gallery__frame icon-banner icon-banner--" + product.gradient;

      if (hasPhoto) {
        // --product-img-1/2 are read by css/components.css (.gallery__frame,
        // #gallery-thumb-1/2) — the actual hover swap between them is pure
        // CSS (a ~ sibling selector), no JS involved once these are set.
        gallery.style.setProperty("--product-img-1", "url('" + FusionRender.cssImageUrl(fallbackPrimary) + "')");
        gallery.style.setProperty("--product-img-2", "url('" + FusionRender.cssImageUrl(fallbackSecondary) + "')");
        gallery.dataset.fallbackImg1 = FusionRender.fallbackImageFor(product, 0);
        gallery.dataset.fallbackImg2 = FusionRender.fallbackImageFor(product, 1);
        checkBackgroundImage(gallery, "--product-img-1", gallery.dataset.fallbackImg1);
        checkBackgroundImage(gallery, "--product-img-2", gallery.dataset.fallbackImg2);
        if (mainIcon) mainIcon.style.display = "none";
        thumb1.hidden = false;
        thumb2.hidden = false;
        thumb1.classList.remove("is-active");
        thumb2.classList.remove("is-active");
        // :hover/:focus-visible drive the swap on desktop; a click "pins" a
        // thumbnail's photo in the preview too, so touch devices (no hover)
        // get the same interaction.
        [thumb1, thumb2].forEach(function (thumb, i) {
          thumb.onclick = function () {
            thumb1.classList.toggle("is-active", i === 0);
            thumb2.classList.toggle("is-active", i === 1);
          };
        });
      } else {
        gallery.style.removeProperty("--product-img-1");
        gallery.style.removeProperty("--product-img-2");
        if (mainIcon) {
          mainIcon.style.display = "";
          var use = mainIcon.querySelector("use");
          if (use) use.setAttribute("href", "images/icons/sprite.svg#icon-" + product.icon);
        }
        thumb1.hidden = true;
        thumb2.hidden = true;
      }

      var macroWrap = $("#nutrition-summary-macros");
      function bar(cls, label, value, pct) {
        return '<div class="macro"><span class="macro__label"><span>' + label + "</span><span>" + value + '</span></span><div class="macro__bar ' + cls + '"><span style="width:' + pct + '%"></span></div></div>';
      }
      macroWrap.innerHTML =
        bar("macro__bar--protein", "Protein", product.protein + "g", Math.min(product.protein * 2.8, 100)) +
        bar("macro__bar--carbs", "Carbs", product.carbs + "g", Math.min(product.carbs * 1.8, 100)) +
        bar("macro__bar--fat", "Fat", product.fat + "g", Math.min(product.fat * 3.2, 100)) +
        bar("", "Calories", product.calories + " kcal", Math.min(product.calories / 6, 100));

      $("#tab-ingredients").textContent = product.ingredients;
      $("#tab-preparation").textContent = product.preparation;
      $("#tab-benefits").textContent = product.benefits;
      $("#tab-serving").innerHTML = "<strong>Serving Size:</strong> " + product.servingSize + " &nbsp; <strong>Allergens:</strong> " + product.allergens;
      var deliveryTab = $("#tab-delivery");
      if (deliveryTab) deliveryTab.textContent = "Delivered in insulated, eco-friendly packaging. Estimated delivery: " + product.deliveryTime + " from order confirmation.";

      var favBtn = $("#product-wishlist-btn");
      if (favBtn) {
        favBtn.setAttribute("data-product-id", product.id);
        var isWished = FusionCart.isWishlisted(product.id);
        favBtn.setAttribute("aria-pressed", isWished ? "true" : "false");
        favBtn.classList.toggle("is-active", isWished);
      }
      $all('[data-action="add-to-cart"], [data-action="buy-now"]').forEach(function (btn) {
        if (btn.closest("#related-meals-grid")) return;
        btn.setAttribute("data-product-id", product.id);
      });

      FusionAPI.getRelatedProducts(product.id, 4).then(function (related) {
        var relGrid = $("#related-meals-grid");
        if (relGrid) relGrid.innerHTML = related.map(function (p) { return FusionRender.productCard(p, { wishlisted: FusionCart.isWishlisted(p.id) }); }).join("");
      });
    });
  }

  /* ---------- PAGE: CART ---------- */
  function initCartPage(products) {
    var itemsWrap = $("#cart-items");
    if (!itemsWrap) return null;

    function render() {
      var couponInput = $("#coupon-code");
      var summary = FusionCart.getCartSummary(products, couponInput ? couponInput.value : "");

      itemsWrap.innerHTML = summary.lines.length
        ? summary.lines.map(FusionRender.cartItem).join("")
        : FusionRender.emptyState("Your cart is empty.", "products.html", "Browse Meals");

      $("#cart-subtotal").textContent = FusionCart.formatCurrency(summary.subtotal);
      $("#cart-delivery").textContent = summary.delivery === 0 ? "Free" : FusionCart.formatCurrency(summary.delivery);
      $("#cart-discount").textContent = "−" + FusionCart.formatCurrency(summary.discount);
      $("#cart-total").textContent = FusionCart.formatCurrency(summary.total);

      var countLabel = $("#cart-item-count");
      if (countLabel) countLabel.textContent = FusionCart.getCartCount();
    }

    render();
    return render;
  }

  /* ---------- PAGE: PROFILE (favorite meals) ---------- */
  function initProfile(products) {
    var favWrap = $("#favorite-meals-grid");
    if (!favWrap) return;
    var wishlist = FusionCart.getWishlist();
    var favorites = products.filter(function (p) { return wishlist.indexOf(p.id) !== -1; });
    favWrap.innerHTML = favorites.length
      ? favorites.map(function (p) { return FusionRender.productCard(p, { wishlisted: true }); }).join("")
      : FusionRender.emptyState("No favorite meals yet — tap the heart on any meal to save it here.", "products.html", "Browse Meals");
  }

  /* ---------- BLOG (static content — DOM-only filter) ---------- */
  function initBlogFilter() {
    var group = $("#blog-category-filter");
    if (!group) return;
    $all(".filter-chip", group).forEach(function (chip) {
      chip.addEventListener("click", function () {
        $all(".filter-chip", group).forEach(function (c) { c.setAttribute("aria-pressed", "false"); });
        chip.setAttribute("aria-pressed", "true");
        var filter = chip.getAttribute("data-filter");
        $all("#blog-grid > article").forEach(function (card) {
          var match = filter === "all" || card.getAttribute("data-category") === filter;
          card.style.display = match ? "" : "none";
        });
      });
    });
  }

  /* ---------- THEME TOGGLE (light / dark) ---------- */
  function initThemeToggle() {
    var btn = $("#theme-toggle");
    if (!btn) return;

    function apply(theme) {
      document.documentElement.setAttribute("data-theme", theme);
      btn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
      btn.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
    }

    // The inline <script> in <head> already set data-theme before first
    // paint (avoids a flash of the wrong theme) — just sync the button to it.
    apply(document.documentElement.getAttribute("data-theme") || "light");

    btn.addEventListener("click", function () {
      var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      try { window.localStorage.setItem("fusion_theme", next); } catch (err) { /* storage unavailable */ }
      apply(next);
    });
  }

  /* ---------- API-DOWN FALLBACK ----------
     Every page-init function is gated behind FusionAPI.getProducts(); if
     that fetch fails (API not running, wrong FUSION_API_BASE, CORS, etc.)
     the .then() above never runs and every grid was silently stuck on its
     static "Loading…" placeholder forever with no clue why. Replace those
     placeholders with an actual, actionable message instead. */
  function showApiUnreachableError(err) {
    console.error("[FUSION] Could not load products from the API:", err && err.message);
    var message = "Couldn't reach the FUSION API. Make sure the server is running " +
      "(cd server && npm start) and reachable at the address configured in js/api.js, then reload this page.";
    var grids = ["#product-grid", "#nutrition-grid", "#home-special-grid", "#home-bestsellers-grid",
      "#category-grid", "#cart-items", "#favorite-meals-grid", "#related-meals-grid"];
    grids.forEach(function (sel) {
      var el = $(sel);
      if (el) el.innerHTML = FusionRender.emptyState(message);
    });
  }

  /* ---------- BOOT ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    initThemeToggle();
    initNavbar();
    initBlogFilter();
    initStatCounters();
    initProductImageFallbacks();
    
    FusionCart.updateCartBadges();

    var cartRender = null;
    var state = {
      /* Adding/removing a line changes how many items are in the cart, so the
         header badge updates too. */
      onCartChange: function () {
        if (cartRender) cartRender();
        FusionCart.updateCartBadges();
      },
      /* Adjusting the quantity of a line already in the cart only refreshes
         the cart page totals — the header badge should not tick on every
         stepper click, only when Add To Cart is actually pressed. */
      onCartQtyChange: function () {
        if (cartRender) cartRender();
      }
    };
    initGlobalActions(state);

    FusionAPI.getProducts().then(function (products) {
      initHome(products);
      initProducts(products);
      initNutrition(products);
      initSinglePage(products);
      initProfile(products);
      cartRender = initCartPage(products);

      FusionAPI.getCategories().then(function (categories) {
        initCategories(products, categories);
        initScrollReveal();
      }).catch(function () { initScrollReveal(); });

      if (!$("#category-grid")) initScrollReveal();

      document.addEventListener("submit", function (e) {
        if (e.target.id === "product-toolbar" || e.target.id === "nutrition-toolbar") e.preventDefault();
      });
    }).catch(showApiUnreachableError);
  });
})();
