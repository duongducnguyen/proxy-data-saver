/**
 * TLS ClientHello SNI Parser
 * Extracts Server Name Indication from TLS ClientHello packets
 *
 * Reference: RFC 5246 (TLS 1.2), RFC 6066 (SNI Extension)
 */

export interface SNIResult {
  hostname: string | null;
  tlsVersion: string | null;
}

/**
 * Parse SNI from TLS ClientHello packet
 * Returns null if not a valid ClientHello or SNI not found
 */
export function parseSNI(buffer: Buffer): SNIResult {
  const result: SNIResult = { hostname: null, tlsVersion: null };

  try {
    if (buffer.length < 5) return result;

    // TLS Record Layer
    const recordType = buffer[0];
    if (recordType !== 0x16) return result; // Not a handshake record

    const recordVersion = (buffer[1] << 8) | buffer[2];
    result.tlsVersion = getTLSVersionString(recordVersion);

    const recordLength = (buffer[3] << 8) | buffer[4];
    if (buffer.length < 5 + recordLength) return result;

    // Handshake Layer
    let offset = 5;
    const handshakeType = buffer[offset];
    if (handshakeType !== 0x01) return result; // Not ClientHello

    offset += 1;

    // Handshake length (3 bytes)
    const handshakeLength = (buffer[offset] << 16) | (buffer[offset + 1] << 8) | buffer[offset + 2];
    offset += 3;

    if (buffer.length < offset + handshakeLength) return result;

    // Client Version (2 bytes)
    offset += 2;

    // Random (32 bytes)
    offset += 32;

    // Session ID
    const sessionIdLength = buffer[offset];
    offset += 1 + sessionIdLength;

    // Cipher Suites
    const cipherSuitesLength = (buffer[offset] << 8) | buffer[offset + 1];
    offset += 2 + cipherSuitesLength;

    // Compression Methods
    const compressionMethodsLength = buffer[offset];
    offset += 1 + compressionMethodsLength;

    // Extensions
    if (offset + 2 > buffer.length) return result;

    const extensionsLength = (buffer[offset] << 8) | buffer[offset + 1];
    offset += 2;

    const extensionsEnd = offset + extensionsLength;
    if (extensionsEnd > buffer.length) return result;

    // Parse extensions to find SNI
    while (offset + 4 <= extensionsEnd) {
      const extensionType = (buffer[offset] << 8) | buffer[offset + 1];
      const extensionLength = (buffer[offset + 2] << 8) | buffer[offset + 3];
      offset += 4;

      if (extensionType === 0x0000) { // SNI extension
        // SNI extension data
        if (offset + 2 > buffer.length) break;

        const sniListLength = (buffer[offset] << 8) | buffer[offset + 1];
        offset += 2;

        const sniEnd = offset + sniListLength;
        while (offset + 3 <= sniEnd) {
          const nameType = buffer[offset];
          const nameLength = (buffer[offset + 1] << 8) | buffer[offset + 2];
          offset += 3;

          if (nameType === 0x00) { // host_name
            if (offset + nameLength <= buffer.length) {
              result.hostname = buffer.slice(offset, offset + nameLength).toString('ascii');
              return result;
            }
          }
          offset += nameLength;
        }
        break;
      }

      offset += extensionLength;
    }
  } catch (e) {
    // Parse error - return what we have
  }

  return result;
}

function getTLSVersionString(version: number): string {
  switch (version) {
    case 0x0300: return 'SSL 3.0';
    case 0x0301: return 'TLS 1.0';
    case 0x0302: return 'TLS 1.1';
    case 0x0303: return 'TLS 1.2';
    case 0x0304: return 'TLS 1.3';
    default: return `Unknown (0x${version.toString(16)})`;
  }
}

/**
 * Check if buffer looks like start of TLS ClientHello
 * Used to detect if we should try to parse SNI
 */
export function isTLSClientHello(buffer: Buffer): boolean {
  if (buffer.length < 6) return false;

  // Check record type (handshake = 0x16)
  if (buffer[0] !== 0x16) return false;

  // Check version (should be 0x0301, 0x0302, 0x0303, or 0x0304)
  const version = (buffer[1] << 8) | buffer[2];
  if (version < 0x0301 || version > 0x0304) return false;

  // Check handshake type at offset 5 (ClientHello = 0x01)
  if (buffer[5] !== 0x01) return false;

  return true;
}
