/* ==========================================================================
   FUSION — CARD RENDER TEMPLATES
   Pure string-template functions that turn API product/category data into
   markup matching the site's existing CSS components. Icons are inline
   <svg><use> references into the shared sprite (images/icons/sprite.svg);
   product photos (image1/image2) are painted as CSS backgrounds so the
   hover crossfade runs on ::before/::after with no extra <img> tags.
   ========================================================================== */

(function (window) {
  "use strict";

  var SPRITE = "images/icons/sprite.svg";
  var PRODUCT_IMAGE_OVERRIDES = {
    "coffee-cake": ["images/fusionassets/CoffeeCake1.jpg", "images/fusionassets/CoffeeCake2.jpg"]
  };
  var PRODUCT_PRICE_OVERRIDES = {
    // Update these values here when you want a UI-only price change without touching the API.
    "coffee-cake": 399
  };

  function applyProductOverrides(product) {
    if (!product || typeof product !== "object") return product;
    var normalized = Object.assign({}, product);
    var overridePrice = PRODUCT_PRICE_OVERRIDES[normalized.id];
    if (overridePrice !== undefined) normalized.price = overridePrice;
    var overrideImages = PRODUCT_IMAGE_OVERRIDES[normalized.id];
    if (overrideImages) {
      normalized.image1 = overrideImages[0];
      normalized.image2 = overrideImages[1];
    }
    return normalized;
  }

  function icon(name, cls) {
    return '<svg class="icon' + (cls ? " " + cls : "") + '" aria-hidden="true" focusable="false"><use href="' + SPRITE + '#icon-' + name + '"></use></svg>';
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  function imageUrl(path) {
    if (!path) return "";
    var url = String(path).trim();
    if (/^(?:[a-z]+:)?\/\//i.test(url) || /^(?:data|blob):/i.test(url)) return url;
    return url.replace(/^\/+/, "");
  }

  function cssImageUrl(path) {
    var url = imageUrl(path);
    if (/^(?:[a-z]+:)?\/\//i.test(url) || /^(?:data|blob):/i.test(url)) return url;
    return typeof document !== "undefined" && document.baseURI ? new URL(url, document.baseURI).href : url;
  }

  function fallbackImageFor(product, index) {
    var normalized = applyProductOverrides(product);
    var fallbackMap = {
      "healthy-salads": ["images/fusionassets/ChickenandQuinoaSalad1.jpg", "images/fusionassets/ChickenCaesarSalad1.jpg"],
      "veg-rice-bowls": ["images/fusionassets/GoldenSpinachBrownFriedRiceBowl1.jpg", "images/fusionassets/PaneerMasalaCurryRicebowl1.jpg"],
      "non-veg-rice-bowls": ["images/fusionassets/ChickenMasalaBrownRicebowl1.jpg", "images/fusionassets/KadaiChickenBrownRicebowl1.jpg"],
      "sandwiches": ["images/fusionassets/GrilledChickenSandwich1.jpg", "images/fusionassets/PaneerTikkaSandwich1.jpg"],
      "wraps": ["images/fusionassets/PaneerTikkaWrap1.jpg", "images/fusionassets/MightyChickenWrap1.jpg"],
      "pancakes": ["images/fusionassets/ProteinPancakes1.jpg", "images/fusionassets/BlueberryPancakes1.jpg"],
      "smoothies": ["images/fusionassets/PostWorkoutSmoothie1.jpg", "images/fusionassets/AlmondFeastSmoothie1.jpg"],
      "healthy-cakes": ["images/fusionassets/CoffeeCake1.jpg", "images/fusionassets/RagiChocolateCake1.jpg"]
    };
    var key = normalized && normalized.categorySlug ? normalized.categorySlug : "healthy-salads";
    var images = fallbackMap[key] || fallbackMap["healthy-salads"];
    var choice = images[(index || 0) % images.length] || images[0];
    return choice;
  }

  function productImageFor(product, index) {
    var normalized = applyProductOverrides(product);
    var path = normalized && (index ? normalized.image2 : normalized.image1);
    var url = path ? String(path).trim() : "";
    if (/^(?:[a-z]+:)?\/\//i.test(url) || /^(?:data|blob):/i.test(url)) return url;
    return url ? imageUrl(url) : "";
  }

  function categoryIconFor(product) {
    var category = product && product.categorySlug ? product.categorySlug : "";
    var map = {
      "healthy-salads": "leaf",
      "veg-rice-bowls": "bowl",
      "non-veg-rice-bowls": "bowl",
      "sandwiches": "sandwich",
      "wraps": "wrap",
      "pancakes": "pancake",
      "smoothies": "smoothie",
      "healthy-cakes": "cake"
    };
    return map[category] || (product && product.icon) || "leaf";
  }

  function badgesHtml(badges) {
    var map = { healthy: "Healthy", new: "New", sale: "Sale" };
    return (badges || []).map(function (b) {
      return '<span class="badge badge--' + b + '">' + (map[b] || b) + "</span>";
    }).join("");
  }

  function priceHtml(product) {
    var normalized = applyProductOverrides(product);
    var out = '<span class="product-card__price">₹' + normalized.price;
    if (normalized.oldPrice) {
      out += " <small>₹" + normalized.oldPrice + "</small>";
      var savePct = Math.round((1 - normalized.price / normalized.oldPrice) * 100);
      out += '<span class="product-card__save">Save ' + savePct + "%</span>";
    }
    out += "</span>";
    return out;
  }

  /** Card media: a real photo (image1, swaps to image2 on hover/focus via CSS
   *  ::before/::after) when the product has photos, otherwise the gradient
   *  icon banner fallback. */
  function mediaHtml(product, opts) {
    opts = opts || {};
    var image1 = productImageFor(product, 0);
    var image2 = productImageFor(product, 1);
    if (image1 || image2) {
      image1 = image1 || image2;
      var firstImage = image1 ? "url('" + cssImageUrl(image1) + "')" : "none";
      var secondImage = image2 ? "url('" + cssImageUrl(image2) + "')" : "none";
      var vars = "--product-img-1:" + firstImage + ";--product-img-2:" + secondImage + ";--product-placeholder:var(--gradient-" + product.gradient + ");";
      if (opts.flipImages && image2) {
        return '<div class="product-card__photo product-card__photo--flip" style="' + vars + '"><div class="product-card__photo-flipper"><img class="product-card__image product-card__image--front" src="' + escapeHtml(imageUrl(image1)) + '" alt="' + escapeHtml(product.name) + '" loading="lazy"><img class="product-card__image product-card__image--back" src="' + escapeHtml(imageUrl(image2)) + '" alt="' + escapeHtml(product.name) + ' alternate view" loading="lazy"></div></div>';
      }
      return '<div class="product-card__photo" style="' + vars + '"><img class="product-card__image" src="' + escapeHtml(imageUrl(image1)) + '" alt="' + escapeHtml(product.name) + '" loading="lazy"></div>';
    }
    return '<div class="icon-banner icon-banner--' + product.gradient + '">' + icon(product.icon, "icon--xl") + "</div>";
  }

  /** Small round thumbnail used in cart lines — photo when available, icon badge otherwise. */
  function thumbHtml(product, cls) {
    var image = productImageFor(product, 0) || productImageFor(product, 1);
    if (image) {
      return '<div class="icon-badge icon-badge--photo' + (cls ? " " + cls : "") + '" style="background-image:url(\'' + imageUrl(image) + "')\" data-fallback-image=\"" + fallbackImageFor(product, 0) + "\" role=\"img\" aria-label=\"" + escapeHtml(product.name) + '\"></div>';
    }
    return '<div class="icon-badge icon-badge--' + product.gradient + (cls ? " " + cls : "") + '">' + icon(product.icon, "icon--lg") + "</div>";
  }

  function favButton(product, wishlisted) {
    return '<button type="button" class="product-card__fav' + (wishlisted ? " is-active" : "") + '" ' +
      'aria-label="' + (wishlisted ? "Remove " : "Add ") + escapeHtml(product.name) + (wishlisted ? " from" : " to") + ' wishlist" ' +
      'aria-pressed="' + (wishlisted ? "true" : "false") + '" data-action="toggle-favorite" data-product-id="' + product.id + '">' +
      icon("heart", "icon--sm" + (wishlisted ? " icon--filled" : "")) +
      "</button>";
  }

  var FusionRender = {
    icon: icon,
    imageUrl: imageUrl,
    cssImageUrl: cssImageUrl,
    fallbackImageFor: fallbackImageFor,
    productImageFor: productImageFor,
    normalizeProduct: applyProductOverrides,

    /** Standard hover-flip product card */
    productCard: function (product, opts) {
      opts = opts || {};
      product = applyProductOverrides(product);
      var wishlisted = opts.wishlisted || false;
      return (
        '<article class="product-card anim-fade-up' + (opts.extraClass ? " " + opts.extraClass : "") + '" data-product-id="' + product.id + '" data-category="' + product.categorySlug + '" data-price="' + product.price + '" data-rating="' + product.rating + '" data-protein="' + product.protein + '" data-calories="' + product.calories + '">' +
          '<a class="product-card__link" href="singlepage.html?id=' + product.id + '" aria-label="View details for ' + escapeHtml(product.name) + '">' +
            '<div class="product-card__media">' +
              '<div class="product-card__badges">' + badgesHtml(product.badges) + "</div>" +
              favButton(product, wishlisted) +
              mediaHtml(product, opts) +
            "</div>" +
          "</a>" +
          '<div class="product-card__body">' +
            '<span class="product-card__category">' + escapeHtml(product.category) + "</span>" +
            '<h3 class="product-card__name"><a href="singlepage.html?id=' + product.id + '">' + escapeHtml(product.name) + "</a></h3>" +
            '<p class="product-card__desc">' + escapeHtml(product.description) + "</p>" +
            '<div class="product-card__tags"><span class="tag">Protein ' + product.protein + 'g</span><span class="tag">' + product.calories + ' kcal</span></div>' +
            '<div class="product-card__meta"><span class="rating">' + icon("star", "icon--xs icon--filled") + " " + product.rating + ' <span class="rating__count">(' + product.ratingCount + ')</span></span><span>' + icon("clock", "icon--xs") + " " + product.deliveryTime + "</span></div>" +
            '<div class="product-card__footer">' + priceHtml(product) + "</div>" +
          "</div>" +
          '<div class="product-card__actions">' +
            '<button type="button" class="btn btn--cart btn--sm btn--block" data-action="add-to-cart" data-product-id="' + product.id + '">' + icon("cart", "icon--sm") + " Add To Cart</button>" +
            '<button type="button" class="btn btn--ghost btn--sm" data-action="quick-view" data-product-id="' + product.id + '" aria-label="Quick view ' + escapeHtml(product.name) + '">' + icon("eye", "icon--sm") + "</button>" +
          "</div>" +
        "</article>"
      );
    },

    /** Flip 3D card — auto-flips continuously when opts.auto is true, otherwise flips on hover/focus */
    flipProductCard: function (product, opts) {
      opts = opts || {};
      product = applyProductOverrides(product);
      var flipClass = opts.auto === false ? "product-card--flip-hover" : "product-card--auto-flip";
      return (
        '<article class="product-card ' + flipClass + ' flip-card anim-fade-up' + (opts.extraClass ? " " + opts.extraClass : "") + '" data-product-id="' + product.id + '" data-category="' + product.categorySlug + '" data-price="' + product.price + '" data-rating="' + product.rating + '" data-protein="' + product.protein + '" data-calories="' + product.calories + '">' +
          (opts.auto === false ? "" : '<span class="special-ribbon">Special</span>') +
          '<div class="flip-card__inner">' +
            '<div class="flip-card__face">' +
              mediaHtml(product) +
              '<div class="product-card__body">' +
                '<h3 class="product-card__name">' + escapeHtml(product.name) + "</h3>" +
                priceHtml(product) +
                '<span class="tag">' + product.calories + " kcal</span>" +
              "</div>" +
            "</div>" +
            '<div class="flip-card__face flip-card__face--back">' +
              "<h4>" + escapeHtml(product.name) + "</h4>" +
              "<p>" + escapeHtml(product.description) + "</p>" +
              '<ul class="flip-card__macros"><li>Protein: ' + product.protein + 'g</li><li>Carbs: ' + product.carbs + 'g</li><li>Fat: ' + product.fat + "g</li></ul>" +
              "<p>" + escapeHtml(product.benefits) + "</p>" +
              '<button type="button" class="btn btn--accent btn--sm" data-action="add-to-cart" data-product-id="' + product.id + '">Add To Cart</button>' +
            "</div>" +
          "</div>" +
        "</article>"
      );
    },

    /** Category listing card */
    categoryCard: function (category, countLabel) {
      var href = category.isPlan ? "subscription.html" : "products.html?category=" + category.slug;
      var image = fallbackImageFor({ categorySlug: category.slug }, 0);
      return (
        '<a class="category-card anim-fade-up bg-gradient-' + category.gradient + '" href="' + href + '" data-category="' + category.slug + '" style="background-image:url(\'' + image + '\')">' +
          icon(category.icon, "category-card__icon") +
          '<span class="category-card__count">' + countLabel + "</span>" +
          '<h2 class="category-card__name">' + escapeHtml(category.name) + "</h2>" +
          '<p class="category-card__desc">' + escapeHtml(category.desc) + "</p>" +
        "</a>"
      );
    },

    /** Nutrition explorer card */
    nutritionCard: function (product) {
      product = applyProductOverrides(product);
      var exactIcon = categoryIconFor(product);
      function bar(cls, label, value, pct) {
        return '<div class="macro"><span class="macro__label"><span>' + label + "</span><span>" + value + '</span></span><div class="macro__bar ' + cls + '"><span style="width:' + pct + '%"></span></div></div>';
      }
      return (
        '<article class="nutrition-card anim-fade-up" data-product-id="' + product.id + '" data-category="' + product.categorySlug + '" data-protein="' + product.protein + '" data-calories="' + product.calories + '" data-price="' + product.price + '">' +
          '<div class="flex flex--between">' +
            '<div class="icon-badge icon-badge--sm icon-badge--' + product.gradient + '">' + icon(exactIcon) + "</div>" +
            badgesHtml(product.badges) +
          "</div>" +
          '<h3 style="font-size:var(--fs-md);">' + escapeHtml(product.name) + "</h3>" +
          '<span class="tag">' + escapeHtml(product.category) + "</span>" +
          '<div class="nutrition-card__macros">' +
            bar("macro__bar--protein", "Protein", product.protein + "g", Math.min(product.protein * 2.8, 100)) +
            bar("macro__bar--carbs", "Carbs", product.carbs + "g", Math.min(product.carbs * 1.8, 100)) +
            bar("macro__bar--fat", "Fat", product.fat + "g", Math.min(product.fat * 3.2, 100)) +
            bar("macro__bar--fiber", "Fiber", product.fiber + "g", Math.min(product.fiber * 9, 100)) +
          "</div>" +
          '<div class="product-card__meta"><span>' + product.calories + ' kcal</span><span>Sugar: ' + product.sugar + "g</span></div>" +
        "</article>"
      );
    },

    /** Cart line item */
    cartItem: function (line) {
      var product = line.product;
      return (
        '<article class="cart-item anim-fade-up" data-product-id="' + product.id + '">' +
          thumbHtml(product) +
          "<div>" +
            '<h3 style="font-size:var(--fs-md);"><a href="singlepage.html?id=' + product.id + '">' + escapeHtml(product.name) + "</a></h3>" +
            '<span class="tag">' + escapeHtml(product.category) + "</span>" +
            '<div class="stepper mt-sm" data-product-id="' + product.id + '">' +
              '<button type="button" data-action="decrement-qty" aria-label="Decrease quantity of ' + escapeHtml(product.name) + '">' + icon("minus", "icon--sm") + "</button>" +
              "<output>" + line.qty + "</output>" +
              '<button type="button" data-action="increment-qty" aria-label="Increase quantity of ' + escapeHtml(product.name) + '">' + icon("plus", "icon--sm") + "</button>" +
            "</div>" +
          "</div>" +
          '<div class="text-center">' +
            '<p class="product-card__price">₹' + line.lineTotal + "</p>" +
            '<button type="button" class="btn btn--ghost btn--sm mt-sm" data-action="remove-item" data-product-id="' + product.id + '" aria-label="Remove ' + escapeHtml(product.name) + ' from cart">Remove</button>' +
          "</div>" +
        "</article>"
      );
    },

    /** Empty-state block (cart / grid with no matches) */
    emptyState: function (message, ctaHref, ctaLabel) {
      return (
        '<div class="text-center" style="padding:var(--space-2xl) var(--space-md);grid-column:1/-1;">' +
          '<div class="icon-badge icon-badge--glass icon-badge--lg" style="margin-inline:auto;">' + icon("cart", "icon--lg") + "</div>" +
          '<p class="mt-md">' + escapeHtml(message) + "</p>" +
          (ctaHref ? '<a href="' + ctaHref + '" class="btn btn--primary mt-sm">' + escapeHtml(ctaLabel || "Continue") + "</a>" : "") +
        "</div>"
      );
    }
  };

  window.FusionRender = FusionRender;
})(window);







