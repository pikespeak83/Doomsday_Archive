/** HTTP helpers for talking to the host node over the LAN. */

export function baseUrl(address, port) {
  return `http://${address}:${port}`;
}

async function getJson(url, token) {
  const res = await fetch(url, {
    headers: token ? { "x-archive-token": token } : {}
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, json };
}

export function ping(base) {
  return getJson(`${base}/api/ping`);
}

export function hostInfo(base) {
  return getJson(`${base}/api/host-info`);
}

export function requestAccess(base, deviceId, name) {
  return fetch(`${base}/api/access/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceId, name })
  }).then((r) => r.json());
}

export function accessState(base, deviceId) {
  return getJson(`${base}/api/access/state?deviceId=${encodeURIComponent(deviceId)}`);
}

export function listFiles(base, token, path) {
  return getJson(`${base}/api/files?path=${encodeURIComponent(path || "")}`, token);
}

export function downloadUrl(base, token, path, inline = false) {
  return `${base}/api/download?path=${encodeURIComponent(path)}&token=${encodeURIComponent(token)}${inline ? "&inline=1" : ""}`;
}
