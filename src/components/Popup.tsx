import { createContext, createElement } from 'react'
import { createRoot } from 'react-dom/client'

export const PopupContext = createContext<{
  hide(): void
}>({} as any)

type PopupComponent = React.FunctionComponent

export const createPopup = (
  fc: PopupComponent,
  { cancelable = true, backgroundMask = 'rgba(0, 0, 0, 0.5)' } = {},
) => {
  const container = document.createElement('div')
  container.className =
    'fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-200'
  container.style.background = backgroundMask
  container.style.opacity = '0'
  document.body.appendChild(container)

  let root: ReturnType<typeof createRoot> | null = null

  const ctx = {
    show() {
      container.style.opacity = '1'
    },
    hide() {
      container.style.opacity = '0'
      setTimeout(() => {
        if (root) {
          root.unmount()
          root = null
        }
        setTimeout(() => {
          container.remove()
        }, 10)
      }, 200)
    },
  }

  container.addEventListener('click', (e) => {
    if (cancelable && e.target === container) {
      ctx.hide()
    }
  })

  setTimeout(() => {
    ctx.show()
  })

  root = createRoot(container)
  root.render(
    <PopupContext.Provider value={ctx}>
      <div
        className="bg-surface text-foreground rounded-xl shadow-overlay p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {createElement(fc)}
      </div>
    </PopupContext.Provider>,
  )
  return ctx
}
