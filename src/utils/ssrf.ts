import dns from "dns";
import net from "net";

// Simple check for private/loopback IPs
export function isPrivateIp(hostname: string): boolean {
  // Block localhost, 127.0.0.1, ::1
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1"
  )
    return true;
  // Block common private IP ranges
  if (/^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(hostname))
    return true;
  // Block IPv6 loopback
  if (hostname.startsWith("fd") || hostname.startsWith("fc")) return true;
  return false;
}
