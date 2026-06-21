import { enforceEverest } from 'src/components/EnforceEverestPage'
import i18n from 'src/i18n'

import { callRemote } from 'src/utils'
import { Button } from 'src/components/Button'
import { useAutoDisableNewMods, useInstalledMods } from 'src/states'
import { useState } from 'react'
import { useGlobalContext } from 'src/App'
import { Card, Description, Heading } from '@heroui/react'

function MapCard({ imgSrc, title, alias, desc, name, downloadUrl }) {
  return (
    <Card className="overflow-hidden">
      <img src={imgSrc} alt="" className="rounded-xl" />
      <Card.Header>
        <Card.Title>{title}</Card.Title>
        <Card.Description>
          {i18n.t('别名')}: {alias}
        </Card.Description>
        <Card.Description>{desc}</Card.Description>
      </Card.Header>

      <Card.Footer>
        <InstallButton name={name} url={downloadUrl} />
      </Card.Footer>
    </Card>
  )
}

function InstallButton({ name, url }) {
  const { installedMods } = useInstalledMods()
  const [autoDisableNewMods] = useAutoDisableNewMods()
  const ctx = useGlobalContext()

  const installed = installedMods.some((mod) => mod.name === name)
  const [state, setState] = useState(installed ? i18n.t('已安装') : i18n.t('安装'))

  const startDownload = async () => {
    if (state !== i18n.t('安装')) return
    setState(i18n.t('准备下载'))
    try {
      const [gbFileId] = (await callRemote('get_mod_update', name)) as any[]

      await ctx.download.downloadMod(name, parseInt(gbFileId) === -1 ? url : gbFileId, {
        autoDisableNewMods,
        onProgress(task, progress) {
          setState(
            `${progress}% (${
              task.subtasks.filter((v) => v.state === 'Finished').length
            }/${task.subtasks.length})`,
          )
        },
        async onFinished() {
          setState(i18n.t('已安装'))
          await ctx.modManage.reloadMods()
        },
        onFailed() {
          setState(i18n.t('下载失败'))
        },
      })
    } catch (error) {
      console.error(error)
      setState(i18n.t('下载失败'))
    }
  }
  return <Button onClick={() => startDownload()}>{state}</Button>
}

export const RecommendMaps = () => {
  const noEverest = enforceEverest()
  if (noEverest) return noEverest

  return (
    <div>
      <div className="rec-map">
        <Heading level={1}>{i18n.t('推荐的地图')}</Heading>
        <Description>{i18n.t('这里将会列出一些推荐安装的地图及其简介，请按需安装')}</Description>
        <div className="space-y-6 mt-8">
          <MapCard
            imgSrc="/collabs/strawberry-jam.webp"
            title={i18n.t('草莓酱')}
            alias={i18n.t('酱游 / Strawberry Jam')}
            desc={
              <>
                <p>{i18n.t('最为经典的地图集，于 2023 年推出')}</p>
                <p>{i18n.t('质量极高，每张图都有自己的特色；背景音乐与环境制作精良')}</p>
                <p>
                  {i18n.t('分为五个难度（即酱一至酱五），从刚入门的新手到千小时的老鸟都可以打~')}
                </p>
              </>
            }
            name="StrawberryJam2021"
            downloadUrl="https://celeste.weg.fan/api/v2/download/mods/StrawberryJam2021"
          />

          <MapCard
            imgSrc="/collabs/gallery-collab.webp"
            title={i18n.t('画游')}
            alias="2024CNY / Gallery Collab"
            desc={
              <>
                <p>{i18n.t('包含超过20张地图和一个极其漂亮的大厅')}</p>
                <p>{i18n.t('涵盖酱一至酱五所有难度，数种与众不同的新机制等待玩家去探索')}</p>
                <p>
                  {i18n.t('国人原创图，国风浓厚，难度偏高，美术优美，音乐好听，非常推荐安装尝试')}
                </p>
              </>
            }
            name="ChineseNewYear2024Collab"
            downloadUrl="https://celeste.weg.fan/api/v2/download/mods/ChineseNewYear2024Collab"
          />

          <MapCard
            imgSrc="/collabs/spring-collab.webp"
            title={i18n.t('春游')}
            alias="Spring Collab 2020"
            desc={
              <>
                <p>{i18n.t('包含80+地图，5个章节，数十种新机制')}</p>
                <p>
                  {i18n.t(
                    'Spring Collab 有 5 个大厅供您探索，里面装满了社区制作的地图。地图的难度从早期的原版内容到一些现存最难的 Celeste 地图均有覆盖',
                  )}
                </p>
                <p>{i18n.t('老牌地图，比草莓酱简单，还行')}</p>
              </>
            }
            name="SpringCollab2020"
            downloadUrl="https://celeste.weg.fan/api/v2/download/mods/SpringCollab2020"
          />

          <MapCard
            imgSrc="/collabs/the-road-less-travelled.webp"
            title={i18n.t('孤行路远')}
            alias="the road less travelled"
            desc={
              <>
                <p>{i18n.t('单图，美术和音乐都很好')}</p>
                <p>
                  {i18n.t('MB 自己很喜欢的一张图，有 20-30 面，感觉很平和（中文名是自己翻译的）')}
                </p>
                <p>{i18n.t('A 面难度在 5A - 6A，B面/C面有一些技巧，难度在 7B 的样子')}</p>
              </>
            }
            name="the road less travelled"
            downloadUrl="https://celeste.weg.fan/api/v2/download/mods/the%20road%20less%20travelled"
          />
        </div>
      </div>
    </div>
  )
}
