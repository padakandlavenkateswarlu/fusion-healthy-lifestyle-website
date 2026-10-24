/* ==========================================================================
   FUSION — PRODUCT API CLIENT
   Talks to the FUSION API over fetch(). No product data lives in the
   frontend anymore — everything below is fetched from the deployed API at
   https://fusion-api-mu.vercel.app/api.

   Override at runtime by setting window.FUSION_API_BASE before this script
   runs (e.g. a one-line <script> in an HTML page) — useful for pointing at
   a local server (see /server) during development.
   ========================================================================== */

(function (window) {
  "use strict";

  var API_BASE = window.FUSION_API_BASE || "https://fusion-api-mu.vercel.app/api";

  var productsCache = null;   // in-memory cache of GET /api/products for this page load
  var categoriesCache = null;

  function fallbackProducts() {
    return [
      {
        id: "green-bowl",
        name: "Green Power Bowl",
        category: "Healthy Salads",
        categorySlug: "healthy-salads",
        description: "Crunchy greens, roasted veggies and a protein-rich citrus dressing.",
        price: 289,
        oldPrice: 349,
        rating: 4.8,
        ratingCount: 182,
        deliveryTime: "22 min",
        calories: 420,
        protein: 26,
        carbs: 34,
        fat: 16,
        fiber: 9,
        sugar: 8,
        badges: ["healthy", "new"],
        gradient: "mint",
        icon: "leaf",
        image1: "images/fusionassets/ChickenDonerSalad1.jpg",
        image2: "images/fusionassets/ChickenDonerSalad2.jpg",
        special: true,
        benefits: "High in protein and fibre for a lighter, fuller meal.",
        ingredients: "Baby spinach, quinoa, avocado, chickpeas, cucumber, pomelo and lemon dressing.",
        preparation: "Freshly assembled in under 20 minutes with all ingredients chilled and tossed in-house.",
        servingSize: "350 g",
        allergens: "Sesame, nuts"
      },
      {
        id: "protein-rice-bowl",
        name: "Protein Rice Bowl",
        category: "Veg Rice Bowls",
        categorySlug: "veg-rice-bowls",
        description: "Warm rice, grilled tofu, crisp vegetables and savoury herb sauce.",
        price: 319,
        oldPrice: 389,
        rating: 4.7,
        ratingCount: 164,
        deliveryTime: "25 min",
        calories: 540,
        protein: 24,
        carbs: 58,
        fat: 18,
        fiber: 11,
        sugar: 7,
        badges: ["healthy"],
        gradient: "sage",
        icon: "bowl",
        image1: "images/fusionassets/ChickenDonerSalad2.jpg",
        image2: "images/fusionassets/ChickenDonerSalad1.jpg",
        special: false,
        benefits: "Balanced carbs and protein to keep you energised.",
        ingredients: "Brown rice, tofu, edamame, crunchy cabbage, carrots, cucumber and herb dressing.",
        preparation: "Grilled tofu and veggies are layered over steamed rice and finished with a light sauce.",
        servingSize: "420 g",
        allergens: "Sesame"
      },
      {
        id: "chipotle-chicken-bowl",
        name: "Chipotle Chicken Bowl",
        category: "Non-Veg Rice Bowls",
        categorySlug: "non-veg-rice-bowls",
        description: "Grilled chicken with smoky chipotle flavour and a colourful grain base.",
        price: 349,
        oldPrice: 429,
        rating: 4.9,
        ratingCount: 236,
        deliveryTime: "30 min",
        calories: 610,
        protein: 38,
        carbs: 52,
        fat: 21,
        fiber: 10,
        sugar: 9,
        badges: ["new"],
        gradient: "ember",
        icon: "fire",
        image1: "images/fusionassets/ChickenDonerSalad1.jpg",
        image2: "images/fusionassets/ChickenDonerSalad2.jpg",
        special: true,
        benefits: "A protein-rich post-workout bowl for sustained energy.",
        ingredients: "Grilled chicken, wild rice, black beans, corn, peppers and chipotle mayo.",
        preparation: "Chicken is grilled and glazed before being served with warm rice and crisp vegetables.",
        servingSize: "450 g",
        allergens: "Dairy, sesame"
      },
      {
        id: "avocado-wrap",
        name: "Avocado Crunch Wrap",
        category: "Wraps",
        categorySlug: "wraps",
        description: "A satisfying wrap with avocado, greens and a tangy protein layer.",
        price: 269,
        rating: 4.6,
        ratingCount: 128,
        deliveryTime: "18 min",
        calories: 470,
        protein: 22,
        carbs: 40,
        fat: 20,
        fiber: 8,
        sugar: 6,
        badges: ["healthy"],
        gradient: "peach",
        icon: "wrap",
        image1: "images/fusionassets/ChickenDonerSalad2.jpg",
        image2: "images/fusionassets/ChickenDonerSalad1.jpg",
        special: false,
        benefits: "Great for a quick lunch with healthy fats and fibre.",
        ingredients: "Whole wheat wrap, avocado, grilled tofu, greens, cabbage and lime salsa.",
        preparation: "Everything is folded fresh to order and grilled lightly for texture.",
        servingSize: "320 g",
        allergens: "Sesame"
      },
      {
        id: "garden-sandwich",
        name: "Garden Protein Sandwich",
        category: "Sandwiches",
        categorySlug: "sandwiches",
        description: "Toasted multigrain sandwich layered with greens, veggies and lean protein.",
        price: 279,
        oldPrice: 329,
        rating: 4.5,
        ratingCount: 142,
        deliveryTime: "20 min",
        calories: 500,
        protein: 27,
        carbs: 46,
        fat: 17,
        fiber: 9,
        sugar: 7,
        badges: ["sale"],
        gradient: "gold",
        icon: "sandwich",
        image1: "images/fusionassets/ChickenDonerSalad1.jpg",
        image2: "images/fusionassets/ChickenDonerSalad2.jpg",
        special: false,
        benefits: "A solid high-protein lunch without heavy sauces.",
        ingredients: "Multigrain bread, grilled chicken, lettuce, tomato, cucumber and hummus.",
        preparation: "Toasted and packed with crisp vegetables for a fresh bite.",
        servingSize: "360 g",
        allergens: "Gluten, sesame"
      },
      {
        id: "banana-oat-pancake",
        name: "Banana Oat Pancakes",
        category: "Pancakes",
        categorySlug: "pancakes",
        description: "Soft, naturally sweet pancakes with oats and a protein drizzle.",
        price: 249,
        rating: 4.7,
        ratingCount: 118,
        deliveryTime: "15 min",
        calories: 390,
        protein: 18,
        carbs: 44,
        fat: 12,
        fiber: 6,
        sugar: 14,
        badges: ["healthy"],
        gradient: "sunset",
        icon: "pancake",
        image1: "images/fusionassets/CoffeeCake1.jpg",
        image2: "images/fusionassets/CoffeeCake2.jpg",
        special: true,
        benefits: "Sweet but balanced with fibre and steady energy.",
        ingredients: "Oats, banana, eggs, yogurt and cinnamon maple drizzle.",
        preparation: "Cooked fresh to keep the pancakes fluffy and warm.",
        servingSize: "260 g",
        allergens: "Dairy, gluten"
      },
      {
        id: "berry-smoothie",
        name: "Berry Matcha Smoothie",
        category: "Smoothies",
        categorySlug: "smoothies",
        description: "An antioxidant-rich smoothie with berries, greens and matcha.",
        price: 229,
        rating: 4.8,
        ratingCount: 202,
        deliveryTime: "12 min",
        calories: 320,
        protein: 16,
        carbs: 38,
        fat: 7,
        fiber: 9,
        sugar: 12,
        badges: ["new", "healthy"],
        gradient: "berry",
        icon: "smoothie",
        image1: "images/fusionassets/CoffeeCake2.jpg",
        image2: "images/fusionassets/CoffeeCake1.jpg",
        special: false,
        benefits: "Packed with berries and greens for a light energy lift.",
        ingredients: "Blueberries, spinach, banana, matcha, almond milk and chia.",
        preparation: "Blended to a smooth finish with a naturally sweet fruit base.",
        servingSize: "330 ml",
        allergens: "Tree nuts"
      },
      {
        id: "coffee-cake",
        name: "Coffee Cake Crunch",
        category: "Healthy Cakes",
        categorySlug: "healthy-cakes",
        description: "A lighter cake with coffee notes and a soft almond crumb.",
        price: 399,
        rating: 4.7,
        ratingCount: 95,
        deliveryTime: "18 min",
        calories: 460,
        protein: 14,
        carbs: 52,
        fat: 18,
        fiber: 7,
        sugar: 15,
        badges: ["new"],
        gradient: "cocoa",
        icon: "cake",
        image1: "images/fusionassets/CoffeeCake1.jpg",
        image2: "images/fusionassets/CoffeeCake2.jpg",
        special: false,
        benefits: "A guilt-light dessert option with a satisfying crumb.",
        ingredients: "Whole wheat flour, coffee, oats, almond flour and dark chocolate chips.",
        preparation: "Baked in small batches and finished with a light dusting of cocoa.",
        servingSize: "200 g",
        allergens: "Gluten, nuts"
      }
    ];
  }

  function fallbackCategories() {
    return [
      { slug: "healthy-salads", name: "Healthy Salads", desc: "Fresh greens, grains and crunchy toppings.", gradient: "mint", icon: "leaf", isPlan: false },
      { slug: "veg-rice-bowls", name: "Veg Rice Bowls", desc: "Balanced bowls with grains, veggies and protein.", gradient: "sage", icon: "bowl", isPlan: false },
      { slug: "non-veg-rice-bowls", name: "Non-Veg Rice Bowls", desc: "High protein bowls with grilled meats.", gradient: "ember", icon: "fire", isPlan: false },
      { slug: "sandwiches", name: "Sandwiches", desc: "Quick, hearty and easy to pack.", gradient: "gold", icon: "sandwich", isPlan: false },
      { slug: "wraps", name: "Wraps", desc: "Portable meals with balanced nutrients.", gradient: "peach", icon: "wrap", isPlan: false },
      { slug: "pancakes", name: "Pancakes", desc: "Warm breakfast favourites with clean ingredients.", gradient: "sunset", icon: "pancake", isPlan: false },
      { slug: "smoothies", name: "Smoothies", desc: "Cold, creamy and rich in nutrients.", gradient: "berry", icon: "smoothie", isPlan: false },
      { slug: "healthy-cakes", name: "Healthy Cakes", desc: "Treats that stay lighter and more balanced.", gradient: "cocoa", icon: "cake", isPlan: false }
    ];
  }

  function request(path) {
    return fetch(API_BASE + path)
      .then(function (res) {
        if (!res.ok) throw new Error("FUSION API " + path + " failed with status " + res.status);
        return res.json();
      })
      .catch(function (err) {
        console.error("[FusionAPI]", err.message);
        throw err;
      });
  }

  var FusionAPI = {
    /** GET /api/products — cached per page load since several sections on
     *  the same page (home specials + bestsellers, categories, etc.) all
     *  need the full list. */
    getProducts: function () {
      if (productsCache) return productsCache;
      productsCache = request("/products")
        .catch(function (err) {
          console.warn("[FusionAPI] Falling back to bundled product data.", err && err.message);
          return fallbackProducts();
        });
      return productsCache;
    },

    /** GET /api/products/:id */
    getProductById: function (id) {
      return request("/products/" + encodeURIComponent(id))
        .catch(function () {
          var list = fallbackProducts();
          return list.find(function (product) { return product.id === id; }) || null;
        });
    },

    /** GET /api/categories — cached per page load */
    getCategories: function () {
      if (categoriesCache) return categoriesCache;
      categoriesCache = request("/categories")
        .catch(function (err) {
          console.warn("[FusionAPI] Falling back to bundled category data.", err && err.message);
          return fallbackCategories();
        });
      return categoriesCache;
    },

    /** GET /api/categories/:slug/products — category-scoped product list,
     *  filtered/sorted server-side rather than fetching everything. */
    getProductsByCategory: function (slug, opts) {
      opts = opts || {};
      var qs = "";
      if (opts.query) qs += "&q=" + encodeURIComponent(opts.query);
      if (opts.sort) qs += "&sort=" + encodeURIComponent(opts.sort);
      return request("/categories/" + encodeURIComponent(slug) + "/products" + (qs ? "?" + qs.slice(1) : ""))
        .catch(function () {
          var products = fallbackProducts();
          var filtered = products.filter(function (product) { return product.categorySlug === slug; });
          if (opts.query) {
            var q = String(opts.query).trim().toLowerCase();
            if (q) {
              filtered = filtered.filter(function (product) {
                return product.name.toLowerCase().indexOf(q) !== -1 ||
                  product.category.toLowerCase().indexOf(q) !== -1 ||
                  product.description.toLowerCase().indexOf(q) !== -1;
              });
            }
          }
          if (opts.sort) {
            filtered = FusionAPI.sortProducts(filtered, opts.sort);
          }
          return filtered;
        });
    },

    /** GET /api/products/:id/related */
    getRelatedProducts: function (id, limit) {
      return request("/products/" + encodeURIComponent(id) + "/related?limit=" + (limit || 4))
        .catch(function () {
          var products = fallbackProducts();
          var current = products.find(function (product) { return product.id === id; });
          var related = products.filter(function (product) { return product.id !== id && product.categorySlug === (current && current.categorySlug); });
          if (!related.length) related = products.filter(function (product) { return product.id !== id; });
          return related.slice(0, limit || 4);
        });
    },

    /** GET /api/customizations */
    getDefaultCustomizations: function () {
      return request("/customizations").catch(function () { return []; });
    },

    /** Client-side filter/sort helpers — synchronous, operate on already-fetched data */
    filterProducts: function (products, opts) {
      opts = opts || {};
      var result = products.slice();

      if (opts.category && opts.category !== "all") {
        result = result.filter(function (p) { return p.categorySlug === opts.category; });
      }
      if (opts.query) {
        var q = opts.query.trim().toLowerCase();
        if (q) {
          result = result.filter(function (p) {
            return p.name.toLowerCase().indexOf(q) !== -1 ||
                   p.category.toLowerCase().indexOf(q) !== -1 ||
                   p.description.toLowerCase().indexOf(q) !== -1;
          });
        }
      }
      if (opts.sort) {
        result = FusionAPI.sortProducts(result, opts.sort);
      }
      return result;
    },

    sortProducts: function (products, sortKey) {
      var result = products.slice();
      switch (sortKey) {
        case "price-low": result.sort(function (a, b) { return a.price - b.price; }); break;
        case "price-high": result.sort(function (a, b) { return b.price - a.price; }); break;
        case "rating": result.sort(function (a, b) { return b.rating - a.rating; }); break;
        case "protein": result.sort(function (a, b) { return b.protein - a.protein; }); break;
        case "calories": result.sort(function (a, b) { return a.calories - b.calories; }); break;
        default: result.sort(function (a, b) { return b.ratingCount - a.ratingCount; });
      }
      return result;
    }
  };

  window.FusionAPI = FusionAPI;
})(window);
