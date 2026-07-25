/** Browser shim: isomorphic-ws only default-exports WebSocket; Midnight.js expects `.WebSocket`. */
const WS = globalThis.WebSocket;
export default WS;
export { WS as WebSocket };
