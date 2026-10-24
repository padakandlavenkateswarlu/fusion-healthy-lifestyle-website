/* ==========================================================================
   FUSION — CART & WISHLIST (localStorage-backed)
   Public API: window.FusionCart
   ========================================================================== */

(function (window) {
  "use strict";

  var CART_KEY = "fusion_cart_v1";
  var WISHLIST_KEY = "fusion_wishlist_v1";
  var COUPONS = { WELCOME50: 0.5, HEALTHY10: 0.1, FUSION20: 0.2 };
  var DELIVERY_FEE = 40;
  var FREE_DELIVERY_THRESHOLD = 999;

  function readJSON(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (err) { /* storage unavailable — fail silently */ }
  }

  function notify() {
    document.dispatchEvent(new CustomEvent("fusion:cart-updated", { detail: FusionCart.getCart() }));
  }

  var FusionCart = {
    getCart: function () {
      return readJSON(CART_KEY, []);
    },

    saveCart: function (items) {
      writeJSON(CART_KEY, items);
      notify();
    },

    addToCart: function (id, qty) {
      qty = qty || 1;
      var cart = FusionCart.getCart();
      var existing = cart.find(function (item) { return item.id === id; });
      if (existing) {
        existing.qty += qty;
      } else {
        cart.push({ id: id, qty: qty });
      }
      FusionCart.saveCart(cart);
      return cart;
    },

    removeFromCart: function (id) {
      var cart = FusionCart.getCart().filter(function (item) { return item.id !== id; });
      FusionCart.saveCart(cart);
      return cart;
    },

    setQty: function (id, qty) {
      var cart = FusionCart.getCart();
      if (qty <= 0) {
        return FusionCart.removeFromCart(id);
      }
      var existing = cart.find(function (item) { return item.id === id; });
      if (existing) {
        existing.qty = qty;
      } else {
        cart.push({ id: id, qty: qty });
      }
      FusionCart.saveCart(cart);
      return cart;
    },

    incrementQty: function (id) {
      var cart = FusionCart.getCart();
      var existing = cart.find(function (item) { return item.id === id; });
      return FusionCart.setQty(id, existing ? existing.qty + 1 : 1);
    },

    decrementQty: function (id) {
      var cart = FusionCart.getCart();
      var existing = cart.find(function (item) { return item.id === id; });
      if (!existing) return cart;
      return FusionCart.setQty(id, existing.qty - 1);
    },

    clearCart: function () {
      FusionCart.saveCart([]);
    },

    getCartCount: function () {
      return FusionCart.getCart().reduce(function (sum, item) { return sum + item.qty; }, 0);
    },

    /** Resolves cart {id,qty} rows against live product data and computes totals */
    getCartSummary: function (products, couponCode) {
      var cart = FusionCart.getCart();
      var lines = cart.map(function (item) {
        var product = products.find(function (p) { return p.id === item.id; });
        if (!product) return null;
        return {
          product: product,
          qty: item.qty,
          lineTotal: product.price * item.qty
        };
      }).filter(Boolean);

      var subtotal = lines.reduce(function (sum, line) { return sum + line.lineTotal; }, 0);
      var delivery = subtotal === 0 || subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
      var discountRate = couponCode && COUPONS[couponCode.toUpperCase().trim()] ? COUPONS[couponCode.toUpperCase().trim()] : 0;
      var discount = Math.round(subtotal * discountRate);
      var total = Math.max(subtotal + delivery - discount, 0);

      return { lines: lines, subtotal: subtotal, delivery: delivery, discount: discount, total: total, isValidCoupon: discountRate > 0 };
    },

    /* ---------- WISHLIST ---------- */
    getWishlist: function () {
      return readJSON(WISHLIST_KEY, []);
    },

    isWishlisted: function (id) {
      return FusionCart.getWishlist().indexOf(id) !== -1;
    },

    toggleWishlist: function (id) {
      var list = FusionCart.getWishlist();
      var idx = list.indexOf(id);
      if (idx === -1) {
        list.push(id);
      } else {
        list.splice(idx, 1);
      }
      writeJSON(WISHLIST_KEY, list);
      document.dispatchEvent(new CustomEvent("fusion:wishlist-updated", { detail: list }));
      return idx === -1;
    },

    /* ---------- UI HELPERS ---------- */
    updateCartBadges: function () {
      var count = FusionCart.getCartCount();
      document.querySelectorAll("[data-cart-count]").forEach(function (el) {
        el.textContent = String(count);
        el.style.display = count > 0 ? "" : "none";
      });
    },

    formatCurrency: function (amount) {
      return "₹" + Number(amount).toLocaleString("en-IN");
    }
  };

  window.FusionCart = FusionCart;

  /* Badge refresh is triggered explicitly by the actions that should move it
     (add to cart, remove item) — see js/main.js — not by every cart mutation,
     so adjusting an existing line's quantity doesn't tick the header badge. */
  document.addEventListener("DOMContentLoaded", FusionCart.updateCartBadges);
})(window);
