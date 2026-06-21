/**
 * Environment utilities for Tauri
 * Replaces the old Sciter `@env` module
 */

let _platform: string | null = null

/**
 * Get the current platform: "Windows", "macOS", "Linux"
 */
export async function getPlatform(): Promise<string> {
  if (_platform) return _platform

  try {
    const { platform } = await import('@tauri-apps/plugin-os')
    const p = platform()
    switch (p) {
      case 'windows':
        _platform = 'Windows'
        break

      case 'macos':
        _platform = 'macOS'
        break
      case 'linux':
        _platform = 'Linux'
        break
      default:
        _platform = p
    }
  } catch {
    // Fallback for dev/browser mode
    const ua = navigator.platform || ''
    if (ua.includes('Win')) _platform = 'Windows'
    else if (ua.includes('Mac')) _platform = 'macOS'
    else if (ua.includes('Linux')) _platform = 'Linux'
    else _platform = 'Unknown'
  }

  return _platform!
}

/**
 * Get the system language
 */
export function getSystemLanguage(): string {
  return navigator.language || 'en-US'
}
