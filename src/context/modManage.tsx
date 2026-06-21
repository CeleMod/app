import i18n from 'src/i18n'
import { callRemote } from '../utils'
import { useInstalledMods, useGamePath, useStorage, initGamePath, initModComments } from '../states'
import { useEffect, useContext } from 'react'
import { createPopup, PopupContext } from 'src/components/Popup'
import { ProgressIndicator } from 'src/components/Progress'

let lastGamePath = ''
export const createModManageContext = () => {
  initModComments()

  const { setInstalledMods } = useInstalledMods()
  const [gamePath] = useGamePath()
  const st = useStorage()

  // Save game path to store when it changes
  useEffect(() => {
    if (!gamePath || !st.ready) return
    ;(async () => {
      await st.set('lastGamePath', gamePath)
      await st.save()
    })()
  }, [gamePath, st.ready])

  initGamePath()

  const ctx = {
    reloadMods: async () => {
      if (!gamePath) {
        console.warn('game path not set')
        throw new Error('game path not set')
      }
      const data = (await callRemote('get_installed_mods', gamePath + '/Mods')) as any[]
      setInstalledMods(data)
      return data
    },
    checkInvalidZipMods: async () => {
      if (!gamePath) return
      try {
        const invalidFiles = (await callRemote(
          'get_invalid_zip_mod_files_cmd',
          gamePath + '/Mods',
        )) as string[]
        if (invalidFiles.length === 0) return

        createPopup(() => {
          const { hide } = useContext(PopupContext)

          return (
            <div className="popup-content">
              <div className="title">{i18n.t('发现无效 Mod 压缩包')}</div>
              <div className="content">
                <p>{i18n.t('以下文件不是有效的 zip，继续保留可能导致游戏崩溃：')}</p>
                <p>{invalidFiles.join(', ')}</p>
              </div>
              <div className="buttons">
                <button onClick={hide}>{i18n.t('暂不处理')}</button>
                <button
                  onClick={async () => {
                    try {
                      await callRemote('delete_mod_files', gamePath + '/Mods', invalidFiles)
                      await ctx.reloadMods()
                    } catch (e) {
                      console.error('Failed to delete files:', e)
                    }
                    hide()
                  }}
                >
                  {i18n.t('删除这些文件')}
                </button>
              </div>
            </div>
          )
        })
      } catch (e) {
        console.error('Failed to check invalid zip mods:', e)
      }
    },
    gamePath,
    modsPath: gamePath + '/Mods',
  }

  // WHY THE FUCK useEffect doesn't trigger here
  if (lastGamePath !== gamePath) {
    lastGamePath = gamePath

    if (gamePath) {
      ;(async () => {
        try {
          const ver = (await callRemote('get_everest_version', gamePath)) as string
          if (ver && ver.length > 2) {
            setTimeout(async () => {
              const popup = createPopup(
                () => {
                  return (
                    <div className="loading-popup">
                      <ProgressIndicator infinite />
                      <span>{i18n.t('正在加载 Mod 列表，请稍等')}</span>
                    </div>
                  )
                },
                {
                  cancelable: false,
                },
              )
              try {
                await ctx.reloadMods()
                popup.hide()
                ctx.checkInvalidZipMods()
                const isUsingCache = await callRemote('is_using_cache')
                if (isUsingCache)
                  createPopup(() => {
                    const { hide } = useContext(PopupContext)
                    return (
                      <div className="popup-content">
                        <div className="title">{i18n.t('离线模式')}</div>
                        <div className="content">
                          {i18n.t('正在使用缓存的 Mod 数据，可能已过期或不完整')}
                        </div>
                        <div className="buttons">
                          <button onClick={hide}>{i18n.t('确定')}</button>
                        </div>
                      </div>
                    )
                  })
              } catch (e) {
                popup.hide()
                const p = createPopup(() => {
                  return (
                    <div className="popup-content">
                      <div className="title">{i18n.t('加载 Mod 列表失败')}</div>
                      <div className="content">
                        <p>{i18n.t('请检查游戏路径是否正确，或网络连接是否正常')}</p>
                        <p>{i18n.t('部分功能将不可用')}</p>
                        <p>{String(e)}</p>
                      </div>
                      <div className="buttons">
                        <button
                          onClick={() => {
                            p.hide()
                          }}
                        >
                          {i18n.t('确定')}
                        </button>
                      </div>
                    </div>
                  )
                })
              }
            }, 10)
          }
        } catch (e) {
          console.error('Failed to check everest version:', e)
        }
      })()
    }
  }

  return ctx
}
