import { callRemote, listenProgress } from '../utils'
import { useGamePath, useCurrentEverestVersion } from '../states'
import { create } from 'zustand'

export interface EverestInstallState {
  status: string
  progress: number
}

export const useEverestInstallState = create<{
  everestInstallState: EverestInstallState
  setEverestInstallState: (everestInstallState: EverestInstallState) => void
}>((set) => ({
  everestInstallState: {
    status: '',
    progress: 0,
  },
  setEverestInstallState: (everestInstallState: EverestInstallState) =>
    set({ everestInstallState }),
}))

let lastGamePath: string | undefined
export const useEverestCtx = () => {
  const { setCurrentEverestVersion } = useCurrentEverestVersion()
  const [gamePath] = useGamePath()
  const { everestInstallState, setEverestInstallState } = useEverestInstallState()

  const ctx = {
    async updateEverestVersion() {
      try {
        const ver = (await callRemote('get_everest_version', gamePath)) as string
        console.log('Everest version', ver)
        setCurrentEverestVersion(ver)
      } catch (e) {
        console.error('Failed to get Everest version:', e)
      }
    },
    async downloadAndInstallEverest(url: string) {
      if (everestInstallState.status !== '') return

      setEverestInstallState({ status: 'Downloading Everest', progress: 0 })

      const unlisten = await listenProgress<EverestInstallState>(
        'everest-install-progress',
        (payload) => {
          setEverestInstallState(payload)
        },
      )

      try {
        await callRemote('download_and_install_everest', gamePath, url)
      } catch (e) {
        setEverestInstallState({
          status: `Failed: ${e}`,
          progress: 0,
        })
      } finally {
        unlisten()
      }
    },
  }

  if (lastGamePath !== gamePath) {
    lastGamePath = gamePath

    if (gamePath) {
      ctx.updateEverestVersion()
    }
  }

  return ctx
}
