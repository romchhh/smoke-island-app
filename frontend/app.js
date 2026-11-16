/* Smoke Island storefront
 *
 * The monolithic app was split into readable modules under ./js/
 * Load order is defined in index.html (classic scripts, shared globals):
 *
 *   icons → state → api → layout → pages-shop → pages-account →
 *   mobile → support → bonus-ui → pages-order → render → events →
 *   session → boot
 *
 * This file is intentionally empty so old ?v= cache URLs do not reintroduce
 * the minified bundle.
 */
'use strict';
