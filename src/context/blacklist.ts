import {
  initAlwaysOnMods,
  useAlwaysOnMods,
  useCurrentBlacklistProfile,
  useGamePath,
} from 'src/states'
import { callRemote } from 'src/utils'

export const createBlacklistContext = () => {
  const { profiles, setCurrentProfileName, setCurrentProfile } = useCurrentBlacklistProfile()

  initAlwaysOnMods()
  const [alwaysOnMods] = useAlwaysOnMods()
  const [gamePath] = useGamePath()

  const ctx = {
    switchProfile: (name: string) => {
      console.log('switch to profile', name)
      // Fire and forget - the Tauri command is async but we don't await here
      // to keep the UI responsive
      callRemote('apply_blacklist_profile', gamePath, name, alwaysOnMods).catch(console.error)
      setCurrentProfileName(name)
      setCurrentProfile(profiles.find((p) => p.name === name) || profiles[0])
    },
  }

  return ctx
}
