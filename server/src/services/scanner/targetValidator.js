import dns from 'dns/promises';
import net from 'net';

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);
const ALLOWED_PORTS = new Set([80, 443, 8080, 8443]);

const FORBIDDEN_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '::1',
  '0.0.0.0',
  'metadata.google.internal',
  'instance-data'
]);

/**
 * Converts an IPv4 string to a 32-bit unsigned integer.
 */
function ip4ToLong(ip) {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return null;
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

/**
 * Checks if an IPv4 address is in CIDR.
 */
function isIpInCidr(ipLong, networkLong, maskBits) {
  const mask = maskBits === 0 ? 0 : (~0 << (32 - maskBits)) >>> 0;
  return (ipLong & mask) === (networkLong & mask);
}

const BLOCKED_IPV4_RANGES = [
  { network: '0.0.0.0', mask: 8, label: 'Current network (RFC 1122)' },
  { network: '10.0.0.0', mask: 8, label: 'Private-use network (RFC 1918)' },
  { network: '100.64.0.0', mask: 10, label: 'Shared address space (RFC 6598)' },
  { network: '127.0.0.0', mask: 8, label: 'Loopback (RFC 1122)' },
  { network: '169.254.0.0', mask: 16, label: 'Link-local / Cloud Metadata (RFC 3927)' },
  { network: '172.16.0.0', mask: 12, label: 'Private-use network (RFC 1918)' },
  { network: '192.0.0.0', mask: 24, label: 'IETF Protocol Assignments (RFC 6890)' },
  { network: '192.0.2.0', mask: 24, label: 'Documentation TEST-NET-1 (RFC 5737)' },
  { network: '192.88.99.0', mask: 24, label: '6to4 Relay Anycast (RFC 7526)' },
  { network: '192.168.0.0', mask: 16, label: 'Private-use network (RFC 1918)' },
  { network: '198.18.0.0', mask: 15, label: 'Benchmarking (RFC 2544)' },
  { network: '198.51.100.0', mask: 24, label: 'Documentation TEST-NET-2 (RFC 5737)' },
  { network: '203.0.113.0', mask: 24, label: 'Documentation TEST-NET-3 (RFC 5737)' },
  { network: '224.0.0.0', mask: 4, label: 'Multicast (RFC 5771)' },
  { network: '240.0.0.0', mask: 4, label: 'Reserved (RFC 1112)' },
  { network: '255.255.255.255', mask: 32, label: 'Limited Broadcast (RFC 919)' }
].map(r => ({
  ...r,
  networkLong: ip4ToLong(r.network)
}));

/**
 * Checks if an IPv4 address is in a private, loopback, or reserved range.
 */
export function isPrivateOrReservedIPv4(ip) {
  const ipLong = ip4ToLong(ip);
  if (ipLong === null) return true; // Malformed IP is blocked
  for (const range of BLOCKED_IPV4_RANGES) {
    if (isIpInCidr(ipLong, range.networkLong, range.mask)) {
      return { blocked: true, reason: range.label };
    }
  }
  return { blocked: false };
}

/**
 * Checks if an IPv6 address is private, loopback, link-local, or reserved.
 */
export function isPrivateOrReservedIPv6(ip) {
  const normalized = ip.toLowerCase();
  if (normalized === '::' || normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') {
    return { blocked: true, reason: 'IPv6 loopback' };
  }

  // IPv4-mapped IPv6 address (::ffff:192.0.2.1)
  if (normalized.startsWith('::ffff:') || normalized.startsWith('0:0:0:0:0:ffff:')) {
    const lastPart = normalized.split(':').pop();
    if (net.isIPv4(lastPart)) {
      return isPrivateOrReservedIPv4(lastPart);
    }
  }

  // Unique local addresses fc00::/7 (starts with fc or fd)
  if (/^f[cd][0-9a-f]{2}:/i.test(normalized)) {
    return { blocked: true, reason: 'IPv6 unique local address (RFC 4193)' };
  }

  // Link-local unicast fe80::/10
  if (/^fe[89ab][0-9a-f]:/i.test(normalized)) {
    return { blocked: true, reason: 'IPv6 link-local address (RFC 4291)' };
  }

  // Multicast ff00::/8
  if (/^ff[0-9a-f]{2}:/i.test(normalized)) {
    return { blocked: true, reason: 'IPv6 multicast address (RFC 4291)' };
  }

  return { blocked: false };
}

/**
 * Validates a target URL and resolves its hostname to ensure it does not resolve
 * to any internal, private, or metadata IP addresses.
 *
 * @param {string} rawUrl - Target URL to evaluate
 * @returns {Promise<{ isValid: boolean, error?: string, parsedUrl?: URL, resolvedIps?: string[] }>}
 */
export async function validateTargetUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { isValid: false, error: 'A valid URL string is required.' };
  }

  let parsed;
  try {
    parsed = new URL(rawUrl.trim());
  } catch (err) {
    return { isValid: false, error: 'Malformed URL format. Please include http:// or https://' };
  }

  // Protocol check
  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    return { isValid: false, error: `Protocol "${parsed.protocol}" is not supported. Use http: or https:` };
  }

  // Port check
  const port = parsed.port ? parseInt(parsed.port, 10) : (parsed.protocol === 'https:' ? 443 : 80);
  if (!ALLOWED_PORTS.has(port)) {
    return { isValid: false, error: `Port ${port} is not in the allowed scan ports list (80, 443, 8080, 8443).` };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Prohibited hostnames and suffixes
  if (
    FORBIDDEN_HOSTNAMES.has(hostname) ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.corp') ||
    hostname.endsWith('.onion')
  ) {
    return { isValid: false, error: `Destination host "${hostname}" is restricted or private.` };
  }

  // Check if hostname is direct IP literal
  if (net.isIP(hostname)) {
    if (net.isIPv4(hostname)) {
      const check = isPrivateOrReservedIPv4(hostname);
      if (check.blocked) {
        return { isValid: false, error: `IP address ${hostname} is forbidden: ${check.reason}` };
      }
    } else if (net.isIPv6(hostname)) {
      const check = isPrivateOrReservedIPv6(hostname);
      if (check.blocked) {
        return { isValid: false, error: `IPv6 address ${hostname} is forbidden: ${check.reason}` };
      }
    }
    return {
      isValid: true,
      parsedUrl: parsed,
      resolvedIps: [hostname]
    };
  }

  // Hostname DNS resolution and pre-connect validation
  try {
    const addresses = await dns.lookup(hostname, { all: true, verbatim: true });
    if (!addresses || addresses.length === 0) {
      return { isValid: false, error: `Unable to resolve hostname "${hostname}" to any IP address.` };
    }

    const resolvedIps = [];
    for (const addr of addresses) {
      const ip = addr.address;
      resolvedIps.push(ip);

      if (addr.family === 4) {
        const check = isPrivateOrReservedIPv4(ip);
        if (check.blocked) {
          return {
            isValid: false,
            error: `Target resolved to restricted IP address (${ip}: ${check.reason}). Scanning blocked.`
          };
        }
      } else if (addr.family === 6) {
        const check = isPrivateOrReservedIPv6(ip);
        if (check.blocked) {
          return {
            isValid: false,
            error: `Target resolved to restricted IPv6 address (${ip}: ${check.reason}). Scanning blocked.`
          };
        }
      }
    }

    return {
      isValid: true,
      parsedUrl: parsed,
      resolvedIps
    };
  } catch (dnsErr) {
    return {
      isValid: false,
      error: `DNS resolution failed for hostname "${hostname}": ${dnsErr.message}`
    };
  }
}
