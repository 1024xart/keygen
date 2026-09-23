// A theatrical serial for the art experience, not a security mechanism.
export function makeSerial(program: string, request: string) {
  const base = `${program.trim().toUpperCase()}::${request.trim().toUpperCase()}`;
  let hash = 0x811c9dc5 ^ 0x5ea1;
  for (let i = 0; i < base.length; i++) {
    hash ^= base.charCodeAt(i);
    hash =
      (hash +
        (hash << 1) +
        (hash << 4) +
        (hash << 7) +
        (hash << 8) +
        (hash << 24)) >>>
      0;
  }
  return [
    (hash & 0xffff).toString(16).padStart(4, "0"),
    (hash >>> 16).toString(16).padStart(4, "0"),
    hash.toString(36).slice(0, 4).padStart(4, "0"),
  ]
    .join("-")
    .toUpperCase();
}
