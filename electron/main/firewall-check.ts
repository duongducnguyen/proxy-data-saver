import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface FirewallStatus {
  allowed: boolean;
  checked: boolean;
  error?: string;
}

/**
 * Check if Windows Firewall has allowed the app for public/private networks
 * Uses netsh to query firewall rules
 */
export async function checkFirewallStatus(): Promise<FirewallStatus> {
  // Only check on Windows
  if (process.platform !== 'win32') {
    return { allowed: true, checked: true };
  }

  try {
    // Get the app executable path
    const appPath = process.execPath;

    // Query firewall rules for this app
    const { stdout } = await execAsync(
      `netsh advfirewall firewall show rule name=all dir=in | findstr /i "${appPath.replace(/\\/g, '\\\\')}"`,
      { timeout: 5000 }
    );

    // If we find the app in firewall rules, it's likely allowed
    const allowed = stdout.trim().length > 0;

    return { allowed, checked: true };
  } catch (err) {
    // findstr returns exit code 1 if no match found
    // This means the app is NOT in firewall rules
    if ((err as NodeJS.ErrnoException).code === '1' ||
        (err as Error).message?.includes('exit code 1')) {
      return { allowed: false, checked: true };
    }

    // Other errors - couldn't check
    return {
      allowed: false,
      checked: false,
      error: (err as Error).message
    };
  }
}

/**
 * Request Windows to add firewall rule (will trigger UAC prompt)
 * This opens Windows Firewall settings for manual configuration
 */
export async function openFirewallSettings(): Promise<void> {
  if (process.platform !== 'win32') return;

  try {
    await execAsync('control firewall.cpl');
  } catch (err) {
    console.error('Failed to open firewall settings:', err);
  }
}
