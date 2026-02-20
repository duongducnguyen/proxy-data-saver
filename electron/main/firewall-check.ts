import { exec, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface FirewallStatus {
  allowed: boolean;
  checked: boolean;
  error?: string;
}

const APP_RULE_NAME = 'Proxy Data Saver';

/**
 * Check if Windows Firewall has a rule for this app
 * Uses netsh which doesn't require admin privileges to query
 */
export async function checkFirewallStatus(): Promise<FirewallStatus> {
  // Only check on Windows
  if (process.platform !== 'win32') {
    return { allowed: true, checked: true };
  }

  try {
    // Check if our specific rule exists by name
    const { stdout } = await execAsync(
      `netsh advfirewall firewall show rule name="${APP_RULE_NAME}" dir=in`,
      { timeout: 10000 }
    );

    // If the command succeeds and returns rule info, it exists
    const allowed = stdout.includes('Rule Name:') && stdout.includes(APP_RULE_NAME);
    return { allowed, checked: true };
  } catch (err: unknown) {
    const error = err as { code?: number; message?: string; stderr?: string };

    // "No rules match" means the rule doesn't exist = not allowed
    if (error.stderr?.includes('No rules match') || error.message?.includes('No rules match')) {
      return { allowed: false, checked: true };
    }

    // Exit code 1 with no other error usually means rule not found
    if (error.code === 1) {
      return { allowed: false, checked: true };
    }

    console.error('Firewall check error:', err);
    return {
      allowed: false,
      checked: false,
      error: error.message
    };
  }
}

/**
 * Request Windows to add firewall rule (will trigger UAC prompt)
 * Uses PowerShell Start-Process with -Verb RunAs to elevate
 */
export async function requestFirewallPermission(): Promise<boolean> {
  if (process.platform !== 'win32') return true;

  try {
    const appPath = process.execPath;

    // Build the netsh arguments
    const netshArgs = `advfirewall firewall add rule name="${APP_RULE_NAME}" dir=in action=allow program="${appPath}" enable=yes profile=any`;

    // Use PowerShell to run netsh elevated
    // -Wait ensures we wait for the elevated process to complete
    return new Promise((resolve) => {
      const ps = spawn('powershell', [
        '-NoProfile',
        '-Command',
        `Start-Process -FilePath netsh -ArgumentList '${netshArgs}' -Verb RunAs -Wait`
      ], {
        windowsHide: true
      });

      ps.on('close', (code) => {
        // Code 0 means success, user accepted UAC
        // Non-zero could mean user cancelled UAC or error
        resolve(code === 0);
      });

      ps.on('error', (err) => {
        console.error('Failed to spawn PowerShell:', err);
        resolve(false);
      });
    });
  } catch (err) {
    console.error('Failed to request firewall permission:', err);
    return false;
  }
}
