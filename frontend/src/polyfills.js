// Compatibilidad con navegadores de celular más antiguos (Chrome/WebView
// anteriores a 2021, Safari < 15.4): definen funciones que la app usa y que
// esos navegadores no traen. Sin esto, la pantalla quedaba en blanco al
// entrar.
function definir(objeto, nombre, valor) {
  if (objeto && !Object.prototype.hasOwnProperty.call(objeto, nombre)) {
    Object.defineProperty(objeto, nombre, { value: valor, writable: true, configurable: true });
  }
}

function at(indice) {
  const n = Math.trunc(Number(indice)) || 0;
  const i = n < 0 ? this.length + n : n;
  return i < 0 || i >= this.length ? undefined : this[i];
}

definir(Array.prototype, "at", at);
definir(String.prototype, "at", at);

definir(Object, "hasOwn", function hasOwn(objeto, propiedad) {
  return Object.prototype.hasOwnProperty.call(Object(objeto), propiedad);
});

definir(Array.prototype, "findLast", function findLast(fn, thisArg) {
  for (let i = this.length - 1; i >= 0; i--) if (fn.call(thisArg, this[i], i, this)) return this[i];
  return undefined;
});

definir(Array.prototype, "findLastIndex", function findLastIndex(fn, thisArg) {
  for (let i = this.length - 1; i >= 0; i--) if (fn.call(thisArg, this[i], i, this)) return i;
  return -1;
});

definir(String.prototype, "replaceAll", function replaceAll(buscar, reemplazo) {
  if (buscar instanceof RegExp) return this.replace(buscar, reemplazo);
  return this.split(String(buscar)).join(typeof reemplazo === "function" ? reemplazo(buscar) : reemplazo);
});

if (typeof window !== "undefined" && typeof window.queueMicrotask !== "function") {
  window.queueMicrotask = (fn) => Promise.resolve().then(fn);
}
