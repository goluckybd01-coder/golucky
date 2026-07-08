/**
 * Password Security Utilities
 * Checks passwords against known leaked password databases using HaveIBeenPwned API
 */

/**
 * Hash a password using SHA-1 (required by HaveIBeenPwned API)
 * Uses the k-Anonymity model - only sends first 5 chars of hash
 */
async function sha1Hash(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

/**
 * Check if a password has been leaked using HaveIBeenPwned API
 * Uses k-Anonymity: only sends first 5 characters of SHA-1 hash
 * Returns the number of times the password was found in breaches (0 if not found)
 */
export async function checkPasswordLeaked(password: string): Promise<{ leaked: boolean; count: number }> {
  try {
    const hash = await sha1Hash(password);
    const prefix = hash.substring(0, 5);
    const suffix = hash.substring(5);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        'Add-Padding': 'true', // Adds padding to prevent timing attacks
      },
    });

    if (!response.ok) {
      console.error('HaveIBeenPwned API error:', response.status);
      // Fail open - don't block registration if API is down
      return { leaked: false, count: 0 };
    }

    const text = await response.text();
    const lines = text.split('\n');

    for (const line of lines) {
      const [hashSuffix, countStr] = line.split(':');
      if (hashSuffix.trim() === suffix) {
        const count = parseInt(countStr.trim(), 10);
        return { leaked: true, count };
      }
    }

    return { leaked: false, count: 0 };
  } catch (error) {
    console.error('Error checking password:', error);
    // Fail open - don't block registration if there's an error
    return { leaked: false, count: 0 };
  }
}

/**
 * Validate password security
 * Returns an error message if password is insecure, null if OK
 */
export async function validatePasswordSecurity(password: string): Promise<string | null> {
  // Check minimum length
  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }

  // Check for leaked password
  const { leaked, count } = await checkPasswordLeaked(password);
  
  if (leaked) {
    if (count > 100000) {
      return `This password has been exposed in ${count.toLocaleString()} data breaches. Please choose a different password.`;
    } else if (count > 1000) {
      return `This password has been found in ${count.toLocaleString()} data breaches. Please choose a more secure password.`;
    } else {
      return 'This password has been found in known data breaches. Please choose a different password.';
    }
  }

  return null;
}
