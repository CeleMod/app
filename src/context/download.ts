import { callRemote, listenProgress } from '../utils'
import {
  useInstalledMods,
  useGamePath,
  useMirror,
  initUseMultiThread,
  useUseMultiThread,
} from '../states'
import { useMemo, useRef } from 'react'
import { EventTarget } from '../utils'

export namespace Download {
  interface Preparing {
    state: 'Preparing'
  }

  interface Downloading {
    state: 'Downloading'
    progress: number
  }

  interface Downloaded {
    state: 'Downloaded'
  }

  interface Failed {
    state: 'Failed'
    reason: string
  }

  export interface SubtaskInfo {
    name: string
    progress: number
    from: string
    to: string
    state: 'Downloading' | 'Finished' | 'Failed' | 'Waiting'
    error?: string
    downloadedBytes: number
    totalBytes: number
    speedBytesPerSec: number
  }

  export type State = Preparing | Downloading | Downloaded | Failed

  export interface TaskInfo {
    name: string
    subtasks: SubtaskInfo[]
    source?: string
    mod: {
      name: string
      id?: string
    }
    state: 'finished' | 'failed' | 'pending'
    error?: string
    progress: number
    canceled?: boolean
  }
}

interface BackendDownloadInfo {
  name: string
  url: string
  dest: string
  status: 'Waiting' | 'Downloading' | 'Finished' | 'Failed'
  data: string
  downloaded_bytes: number
  total_bytes: number
  speed_bytes_per_sec: number
}

interface DownloadProgressPayload {
  subtasks: BackendDownloadInfo[]
  state: string
}

export const createDownloadContext = () => {
  const { installedMods } = useInstalledMods()
  const [gamePath] = useGamePath()

  initUseMultiThread()
  const [useMultiThread] = useUseMultiThread()

  const downloadTasks = useRef<{
    [id: string]: Download.TaskInfo
  }>({})

  const eventBus = useMemo(() => new EventTarget(), [])

  const [downloadMirror] = useMirror()

  const ctx = {
    eventBus,
    downloadTasks,
    cancelDownload(name: string) {
      const task = downloadTasks.current[name]
      if (!task || task.state !== 'pending') return false
      task.canceled = true
      callRemote('cancel_download_mod', name)
      eventBus.dispatchEvent('taskListChanged')
      return true
    },
    downloadMod: async (
      name: string,
      gb_fileid_or_url: string,
      {
        force = false,
        autoDisableNewMods = false,
        onProgress = () => {},
        onFinished = () => {},
        onFailed = () => {},
      }: {
        force?: boolean
        autoDisableNewMods?: boolean
        onProgress?: (task: Download.TaskInfo, progress: number) => void
        onFinished?: (task: Download.TaskInfo) => void
        onFailed?: (task: Download.TaskInfo, error: string) => void
      } = {},
    ) => {
      let url
      if (gb_fileid_or_url.startsWith('http')) url = gb_fileid_or_url
      else {
        const gb_fileid = gb_fileid_or_url
        if (downloadMirror === 'wegfan')
          url = `https://celeste.weg.fan/api/v2/download/gamebanana-files/${gb_fileid}`
        else if (downloadMirror === '0x0ade')
          url = `https://celestemodupdater.0x0a.de/banana-mirror/${gb_fileid}.zip`
        else url = `https://gamebanana.com/dl/${gb_fileid}`
      }

      if (installedMods.find((m) => m.name === name)) {
        if (force) {
          await callRemote('rm_mod', gamePath + '/Mods/', name)
        } else {
          const task = {
            name,
            subtasks: [],
            source: gb_fileid_or_url,
            mod: { name },
            state: 'failed' as const,
            error: 'Mod already installed',
            progress: 0,
          } as Download.TaskInfo
          onFailed(task, 'Mod already installed')
          return task
        }
      }

      if (!downloadTasks.current[name] || force) {
        downloadTasks.current[name] = {
          name,
          subtasks: [],
          source: gb_fileid_or_url,
          mod: { name },
          state: 'pending',
          progress: 0,
          canceled: false,
        }

        eventBus.dispatchEvent('taskListChanged')

        // Listen for download progress events
        const unlisten = await listenProgress<DownloadProgressPayload>(
          'download-mod-progress',
          (payload) => {
            const task = downloadTasks.current[name]
            if (!task) return

            task.subtasks = payload.subtasks.map((s) => ({
              name: s.name,
              progress:
                s.status === 'Downloading' ? parseFloat(s.data) : s.status === 'Finished' ? 100 : 0,
              from: s.url,
              to: s.dest,
              error: s.status === 'Failed' ? s.data : undefined,
              state: s.status,
              downloadedBytes: s.downloaded_bytes || 0,
              totalBytes: s.total_bytes || 0,
              speedBytesPerSec: s.speed_bytes_per_sec || 0,
            }))

            task.state = payload.state as any
            if (payload.state === 'finished') {
              task.canceled = false
              onFinished(task)
            } else if (payload.state === 'failed') {
              task.error = payload.subtasks.find((s) => s.status === 'Failed')?.data
              if (task.error === 'Download canceled') {
                task.canceled = true
              }
              onFailed(task, 'Download failed')
            } else {
              const progress = parseFloat(
                payload.subtasks.find((s) => s.status === 'Downloading')?.data || '0',
              )
              task.progress = progress
              onProgress(task, progress)
            }

            eventBus.dispatchEvent('taskListChanged')
          },
        )

        try {
          await callRemote(
            'download_mod',
            name,
            url,
            gamePath + '/Mods/',
            autoDisableNewMods,
            useMultiThread,
          )
        } catch (e: any) {
          const task = downloadTasks.current[name]
          if (task) {
            task.state = 'failed'
            task.error = e.toString()
            onFailed(task, e.toString())
            eventBus.dispatchEvent('taskListChanged')
          }
        } finally {
          unlisten()
        }
      }
      return downloadTasks.current[name]
    },
  }

  return ctx
}
