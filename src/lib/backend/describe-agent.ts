export function describeAgent(ua: string | null) {
  const agent = ua ?? "";
  const browser = /Edg\//.test(agent)
    ? "Edge"
    : /OPR\//.test(agent)
      ? "Opera"
      : /Chrome\//.test(agent)
        ? "Chrome"
        : /Safari\//.test(agent)
          ? "Safari"
          : /Firefox\//.test(agent)
            ? "Firefox"
            : "Unknown";
  const device = /iPhone|iPad|iPod/.test(agent)
    ? "iOS"
    : /Android/.test(agent)
      ? "Android"
      : /Windows/.test(agent)
        ? "Windows"
        : /Mac OS X/.test(agent)
          ? "macOS"
          : /Linux/.test(agent)
            ? "Linux"
            : "Unknown";
  return { browser, device };
}
