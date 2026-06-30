import { callRemote } from '../utils'
import { useInstalledMods, useGamePath, useStorage, initGamePath, initModComments } from '../states'
import { useEffect, useState } from 'react'
import { toast } from '@heroui/react'
import { useTranslation } from 'react-i18next'
import { useAlert } from 'src/components/alert'

let lastGamePath = ''
export const createModManageContext = () => {
  const { t } = useTranslation()
  initModComments()

  const { setInstalledMods } = useInstalledMods()
  const [gamePath] = useGamePath()
  const st = useStorage()
  const [isLoading, setIsLoading] = useState(false)

  // Save game path to store when it changes
  useEffect(() => {
    if (!gamePath || !st.ready) return
    ;(async () => {
      await st.set('lastGamePath', gamePath)
      await st.save()
    })()
  }, [gamePath, st.ready])

  initGamePath()

  const alert = useAlert()

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
    gamePath,
    modsPath: gamePath + '/Mods',
    isLoading,
  }

  async function checkInvalidZipMods() {
    if (!gamePath) return

    try {
      const invalidFiles = (await callRemote(
        'get_invalid_zip_mod_files_cmd',
        gamePath + '/Mods',
      )) as string[]
      if (invalidFiles.length === 0) return

      alert({
        status: 'warning',
        title: t('发现无效 Mod 压缩包'),
        message: (
          <>
            <p>{t('以下文件不是有效的 zip，继续保留可能导致游戏崩溃：')}</p>
            <p>{invalidFiles.join(', ')}</p>
          </>
        ),
        cancelText: t('暂不处理'),
        okText: t('删除这些文件'),
        onOk: async () => {
          try {
            await callRemote('delete_mod_files', gamePath + '/Mods', invalidFiles)
            await ctx.reloadMods()
          } catch (e) {
            console.error('Failed to delete files:', e)
          }
        },
      })
    } catch (e) {
      console.error('Failed to check invalid zip mods:', e)
    }
  }

  useEffect(() => {
    if (lastGamePath !== gamePath) {
      lastGamePath = gamePath

      effect()

      async function effect() {
        if (gamePath) {
          try {
            const ver = (await callRemote('get_everest_version', gamePath)) as string
            if (ver && ver.length > 2) {
              setIsLoading(true)
              try {
                await ctx.reloadMods()
                await checkInvalidZipMods()
              } catch {
                toast.danger(t('加载 Mod 列表失败'), {
                  description:
                    t('请检查游戏路径是否正确，或网络连接是否正常') + ', ' + t('部分功能将不可用'),
                })
              } finally {
                setIsLoading(false)
              }
            }
          } catch (e) {
            console.error('Failed to check everest version:', e)
            toast.danger('Failed to check everest version', {
              description: e instanceof Error ? e.message : String(e),
            })
          }
        }
      }
    }
  }, [gamePath, ctx])

  return ctx
}
