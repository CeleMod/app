import i18n from 'src/i18n'
import { createPopup } from './Popup'
import { callRemote, getCelemodVersion, compareVersion, listenProgress } from '../utils'
import { Fragment } from 'react'
import { useState } from 'react'
import { ProgressIndicator } from './Progress'

export interface UpdateInfo {
  version: string
  info: string
  auto_download: {
    name: string
    url: string
  }[]
  manual: {
    name: string
    url: string
  }[]
  force?: string
}

export const getLatestUpdateInfo = async () => {
  return await fetch(
    'https://ganbei-hot-update-1258625969.file.myqcloud.com/celemod/updateInfo.json?' + Date.now(),
  )
    .then((v) => v.text())
    .then((v) =>
      v
        .split('\n')
        .filter((v) => !v.trim().startsWith('//'))
        .join('\n'),
    )
    .then((v) => JSON.parse(v) as UpdateInfo)
}

export const checkUpdate = async () => {
  const version = await getCelemodVersion()
  const currentVersion = version
    .split('')
    .filter((v) => v === '.' || !isNaN(parseInt(v)))
    .join('')
  const info = await getLatestUpdateInfo()
  const latestVersion = info.version
    .split('')
    .filter((v) => v === '.' || !isNaN(parseInt(v)))
    .join('')

  const applyForce = compareVersion(currentVersion, info.force ?? '0.0.0') < 0

  if (compareVersion(currentVersion, latestVersion) < 0) {
    createPopup(
      () => {
        const [updateProgress, setUpdateProgress] = useState<null | number>(null)
        const [failReason, setFailReason] = useState<string | null>(null)

        return (
          <div className="update-prompt">
            <div className="title">{i18n.t('Celemod 有更新')}</div>
            <div className="info">
              <div className="vernum">{info.version}</div>
              <div className="detail-text">{i18n.t('更新详情')}</div>
              <pre>{info.info}</pre>
            </div>

            {updateProgress === null ? (
              <Fragment>
                {applyForce && (
                  <div className="force">
                    {i18n.t('您的版本太低')}
                    <br />
                    {i18n.t('如不更新')}
                    <br />
                    {i18n.t('将无法继续使用')}
                  </div>
                )}
                <div className="updateOptions">
                  <div>
                    <span style={{ opacity: 0.6, display: 'inline-block' }}>
                      {i18n.t('手动更新 ·')}
                    </span>
                    {info.manual.map((v, i) => (
                      <span
                        className="download"
                        onClick={() => {
                          callRemote('open_url', v.url)
                        }}
                      >
                        {v.name} {i !== info.manual.length - 1 && '·'}
                      </span>
                    ))}
                  </div>
                  <div>
                    <span style={{ opacity: 0.6, display: 'inline-block' }}>
                      {i18n.t('一键更新 ·')}
                    </span>
                    {info.auto_download.map((v, i) => (
                      <span
                        className="download"
                        onClick={() => {
                          setUpdateProgress(-1)
                          ;(async () => {
                            const unlisten = await listenProgress<any>(
                              'self-update-progress',
                              (event) => {
                                if (event.state === 'downloading') {
                                  setUpdateProgress(event.data)
                                } else if (event.state.startsWith('failed')) {
                                  setFailReason(event.state)
                                }
                              },
                            )
                            try {
                              await callRemote('do_self_update', v.url)
                            } catch (e: any) {
                              setFailReason(e.toString())
                            } finally {
                              unlisten()
                            }
                          })()
                        }}
                      >
                        {v.name} {i !== info.auto_download.length - 1 && '·'}
                      </span>
                    ))}
                  </div>
                </div>
              </Fragment>
            ) : (
              <Fragment>
                {failReason ? (
                  <div className="downloadFailed">
                    <div>{i18n.t('更新失败')}</div>
                    <span>{failReason}</span>
                  </div>
                ) : (
                  <div className="downloadProgress">
                    <div>
                      <ProgressIndicator
                        {...(updateProgress === -1
                          ? {
                              infinite: true,
                              size: 50,
                            }
                          : {
                              value: updateProgress,
                              max: 100,
                              size: 50,
                            })}
                      />
                    </div>
                    <span>{i18n.t('正在下载更新')}</span>
                  </div>
                )}
              </Fragment>
            )}
          </div>
        )
      },
      {
        cancelable: !applyForce,
      },
    )
  }
}

// @ts-ignore expose api to window
window._checkUpdate = checkUpdate
