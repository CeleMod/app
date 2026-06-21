import { createRoot } from 'react-dom/client'
import App from './App'
import { getPlatform } from './env'
// @ts-ignore
import './globals.css'

async function init() {
  // Set platform attribute on html element (was in index.html inline script)
  const platform = await getPlatform()
  document.documentElement.setAttribute('platform', platform)

  // Attach checkUpdate to window for inline scripts
  const { checkUpdate } = await import('./components/SelfUpdate')
  ;(window as any)._checkUpdate = checkUpdate

  // F5 reload
  window.addEventListener('keyup', (evt) => {
    if (evt.code === 'F5') {
      window.location.reload()
    }
  })

  const root = document.getElementById('root')!
  createRoot(root).render(<App />)
}

init()
