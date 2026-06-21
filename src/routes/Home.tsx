import i18n from 'src/i18n'

import { useContext, useState } from 'react'
import { GameSelector } from '../components/GameSelector'
import { Icon } from '../components/Icon'
import { callRemote, selectGamePath, useBlockingMask } from '../utils'
import {
  useAlwaysOnMods,
  useCurrentBlacklistProfile,
  useGamePath,
  useInstalledMods,
  useMirror,
  useStorage,
  useUseMultiThread,
} from '../states'
import { useEffect } from 'react'
import { Checkbox, Select, ListBox } from '@heroui/react'
import { Button } from '../components/Button'
import { createPopup, PopupContext } from '../components/Popup'
import { useGlobalContext } from 'src/App'

export const Home = () => {
  const [gamePath, setGamePath] = useGamePath()
  const [gamePaths, setGamePaths] = useState<string[]>([])

  useEffect(() => {
    ;(async () => {
      try {
        const paths = (await callRemote('get_celeste_dirs')) as string[]
        setGamePaths(paths.filter((v) => v))
        if (!gamePath && paths.length > 0) {
          // setGamePath(paths[0]);
        }
      } catch (e) {
        console.error('Failed to get Celeste dirs:', e)
      }
    })()
  }, [])
  const globalCtx = useGlobalContext()

  const [lastUseMap, setLastUseMap] = useState<{
    [profile: string]: number
  }>({})

  const {
    profiles,
    setProfiles,
    currentProfileName,
    setCurrentProfileName,
    currentProfile,
    setCurrentProfile,
  } = useCurrentBlacklistProfile()

  const st = useStorage()

  useEffect(() => {
    ;(async () => {
      if (!st.ready) return
      const lastUseMap = (await st.get('lastUseMap')) || {}
      setLastUseMap(lastUseMap)
    })()
  }, [st.ready])

  const mask = useBlockingMask()

  useEffect(() => {
    if (!gamePath) return
    ;(async () => {
      try {
        const profile = (await callRemote('get_current_profile', gamePath)) as string
        setCurrentProfileName(profile)
        const profilesData = (await callRemote('get_blacklist_profiles', gamePath)) as any[]
        setProfiles(profilesData)
      } catch (e) {
        console.error('Failed to load profiles:', e)
      }
    })()
  }, [gamePath])

  useEffect(() => {
    setCurrentProfile(profiles.find((v) => v.name === currentProfileName) || null)
  }, [currentProfileName, profiles])

  const [alwaysOnMods] = useAlwaysOnMods()

  useEffect(() => {
    if (!currentProfile || !gamePath) return
    ;(async () => {
      const content = (await callRemote('get_current_blacklist_content', gamePath)) as string
      const disabledFiles = (content || '')
        .split('\n')
        .map((v) => v.trim())
        .filter((v) => v && !v.startsWith('#'))
        .sort()
      const expectedDisabledFiles = currentProfile.mods
        .filter((m) => !alwaysOnMods.includes(m.name))
        .map((m) => m.file)
        .sort()
      if (
        expectedDisabledFiles.some((file) => !disabledFiles.includes(file)) ||
        disabledFiles.some((file) => !expectedDisabledFiles.includes(file))
      ) {
        createPopup(() => {
          const { hide } = useContext(PopupContext)
          return (
            <div className="popup-content">
              <h2>{i18n.t('同步黑名单 Mod 列表')}</h2>
              <p>{i18n.t('当前的 blacklist.txt 与配置文件不同。您想要同步配置文件以匹配吗？')}</p>
              <p>
                {`不同的 Mod: ${[
                  ...new Set([
                    ...expectedDisabledFiles.filter((file) => !disabledFiles.includes(file)),
                    ...disabledFiles.filter((file) => !expectedDisabledFiles.includes(file)),
                  ]),
                ].join(', ')}`}
              </p>
              <p>{i18n.t('注意，该功能不支持通配符等')}</p>
              <div className="buttons">
                <button
                  onClick={async () => {
                    await callRemote(
                      'sync_blacklist_profile_from_file',
                      gamePath,
                      currentProfileName,
                    )
                    const profilesData = (await callRemote(
                      'get_blacklist_profiles',
                      gamePath,
                    )) as any[]
                    setProfiles(profilesData)
                    hide()
                  }}
                >
                  {i18n.t('同步')}
                </button>
                <button onClick={() => hide()}>{i18n.t('忽略')}</button>
              </div>
            </div>
          )
        })
      }
    })()
  }, [currentProfile, gamePath, alwaysOnMods, currentProfileName])

  const formatTime = (time: number) => {
    if (time === 0) return i18n.t('未知')
    const now = Date.now()
    const diff = now - time
    if (diff < 1000 * 60) return i18n.t('刚刚')
    if (diff < 1000 * 60 * 60)
      return i18n.t('{slot0}分钟前', { slot0: Math.floor(diff / 1000 / 60) })
    if (diff < 1000 * 60 * 60 * 24)
      return i18n.t('{slot0}小时前', {
        slot0: Math.floor(diff / 1000 / 60 / 60),
      })
    if (diff < 1000 * 60 * 60 * 24 * 30)
      return i18n.t('{slot0}天前', {
        slot0: Math.floor(diff / 1000 / 60 / 60 / 24),
      })
    if (diff < 1000 * 60 * 60 * 24 * 30 * 12)
      return i18n.t('{slot0}月前', {
        slot0: Math.floor(diff / 1000 / 60 / 60 / 24 / 30),
      })
    return i18n.t('很久以前')
  }

  const [downloadMirror, setDownloadMirror] = useMirror()
  const [useMultiThread, setUseMultiThread] = useUseMultiThread()
  const { installedMods } = useInstalledMods()

  return (
    <div className="home">
      <div className="info">
        <span className="part">
          <img src="/Celemod.png" alt="" srcSet="" />
        </span>
        <span className="part">
          <div className="title">CeleMod</div>
          <div className="subtitle">An alternative mod manager for Celeste</div>
        </span>
      </div>
      <br />

      {gamePath ? (
        <div className="config">
          <GameSelector
            paths={gamePaths}
            onSelect={(value: string) => {
              if (value === '__other__') {
                selectGamePath(setGamePath)
              } else setGamePath(value)
            }}
            launchGame={(v) => {
              lastUseMap[currentProfileName] = Date.now()
              setLastUseMap(lastUseMap)
              st.save()
              mask.setMaskEnabled(true)
              mask.setMaskText(i18n.t('正在启动'))
              callRemote('start_game_directly', gamePath || gamePaths[0], v === 'origin')
              setTimeout(() => {
                mask.setMaskEnabled(false)
              }, 20000)
            }}
          />
        </div>
      ) : (
        <div className="config">
          {i18n.t('未找到游戏！请先安装 Steam 商店或 Epic 商店版的 Celeste，或')}
          <span
            onClick={() => {
              selectGamePath(setGamePath)
            }}
            style={{
              color: '#a77fdb',
            }}
          >
            {i18n.t('点此手动选择')}
          </span>
        </div>
      )}

      <div className="config">
        <Icon name="download" />
        &nbsp;
        <span>{i18n.t('下载设置')}</span>
      </div>

      <div className="config-block">
        <span>{i18n.t('下载镜像')}</span>&nbsp;
        <Select
          className="w-40"
          variant="secondary"
          value={downloadMirror}
          onChange={(v) => setDownloadMirror(v as string)}
        >
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBox.Item id="0x0ade" textValue="0x0ade">
                0x0ade
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="gamebanana" textValue="GameBanana">
                GameBanana
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="wegfan" textValue="WEGFan">
                WEGFan
                <ListBox.ItemIndicator />
              </ListBox.Item>
            </ListBox>
          </Select.Popover>
        </Select>
      </div>

      <div className="config-block">
        <Checkbox
          isSelected={useMultiThread}
          onChange={(v) => {
            setUseMultiThread(v)
          }}
        >
          <Checkbox.Content>
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
            {i18n.t('使用 ureq 多线程下载')}
          </Checkbox.Content>
        </Checkbox>
      </div>

      <div className="config">
        <Icon name="file" />
        &nbsp;
        <span>{i18n.t('Profile 选择')}</span>
      </div>

      <div className="config-block profiles">
        {profiles.map((v) => (
          <div
            className={`profile ${v.name === currentProfileName && 'selected'}`}
            onClick={() => {
              globalCtx.blacklist.switchProfile(v.name)
            }}
          >
            <div className="name">{v.name}</div>
            <div className="info">
              <span className="tips">{i18n.t('上次启动')}</span>
              <span className="inf">{formatTime(lastUseMap[v.name] || 0)}</span>
            </div>

            <div className="info">
              <span className="tips">{i18n.t('启用的 Mod 数')}</span>
              <span className="inf">{installedMods.length - v.mods.length}</span>
            </div>

            <Button
              onClick={
                // @ts-ignore
                (e) => {
                  e.stopPropagation()
                  globalCtx.blacklist.switchProfile(v.name)
                  lastUseMap[v.name] = Date.now()
                  // save()
                  setLastUseMap(lastUseMap)
                  mask.setMaskEnabled(true)
                  mask.setMaskText(i18n.t('正在启动'))
                  setTimeout(() => {
                    callRemote('start_game_directly', gamePath || gamePaths[0], false)
                  }, 300)

                  setTimeout(() => {
                    mask.setMaskEnabled(false)
                  }, 20000)
                }
              }
            >
              {i18n.t('启动')}
            </Button>
          </div>
        ))}
      </div>

      <div className="config theme">
        <Icon name="edit" />
        &nbsp;
        <span>{i18n.t('界面设置')}</span>
      </div>

      <div className="config-block">
        <span>{i18n.t('语言/Language')}</span>&nbsp;
        <Select
          className="w-40"
          variant="secondary"
          value={i18n.language}
          onChange={(v) => {
            const lang = v as string
            i18n.changeLanguage(lang)
            setDownloadMirror(lang === 'zh-CN' ? 'wegfan' : '0x0ade')
          }}
        >
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBox.Item id="zh-CN" textValue="简体中文">
                {i18n.t('简体中文')}
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="en-US" textValue="English">
                English
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="ru-RU" textValue="русский">
                русский
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="pt-BR" textValue="Brazilian Portuguese">
                Brazilian Portuguese
                <ListBox.ItemIndicator />
              </ListBox.Item>
            </ListBox>
          </Select.Popover>
        </Select>
      </div>
    </div>
  )
}
