import i18n from 'src/i18n'
import { Fragment } from 'react'
import { useState, useEffect } from 'react'
import { ModList } from '../components/ModList'
import { currentMirror, initSearchSort, useGamePath, useSearchSort } from '../states'
import { Button } from '../components/Button'
import { Icon } from '../components/Icon'
import { useCallback, useRef } from 'react'
import { Content, searchSubmission } from '../api/wegfan'
import { Select, ListBox } from '@heroui/react'
import { enforceEverest } from '../components/EnforceEverestPage'

const categoryIdMap = {
  Assets: 15655,
  Dialog: 4633,
  Effects: 1501,
  Helpers: 5081,
  Maps: 6800,
  Mechanics: 4635,
  'Other/Misc': 4632,
  Skins: 11181,
  'Twitch Integration': 4636,
  UI: 2317,
}

export const Search = () => {
  const noEverest = enforceEverest()
  if (noEverest) return noEverest

  const [mods, setMods] = useState<Content[]>([])
  const [type, setType] = useState<string>('')
  const [search, setSearch] = useState<string>('')
  const [selectedPath] = useGamePath()
  const [loading, setLoading] = useState(true)
  const loadingLock = useRef(false)
  initSearchSort()
  const [sort, setSort] = useSearchSort()
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const fetchModPage = async (page: number) => {
    console.log('fetching', page)
    setLoading(true)
    const res = await searchSubmission({
      page,
      // @ts-ignore
      categoryId: categoryIdMap[type],
      search,
      sort,
      // section: 'Mod',
      size: 25,
      includeExclusiveSubmissions: currentMirror() === 'wegfan',
    })
    console.log('finished, size:', res.content.length)
    setLoading(false)
    return res
  }

  useEffect(() => {
    setMods([])
    setCurrentPage(1)
    fetchModPage(1).then((v) => {
      setMods(v.content)
      setHasMore(v.hasNextPage)
    })
  }, [type, search, sort])

  useEffect(() => {
    loadingLock.current = false
  }, [mods])

  return (
    <Fragment>
      <div className="filter">
        <input
          type="text"
          className="searchinput"
          onKeyUp={(e) => {
            if (e.keyCode === 257) {
              setSearch((e.target! as any).value)
            }
          }}
        />
        <Button
          onClick={() => {
            setSearch((document.querySelector('.searchinput') as any).value)
          }}
        >
          <Icon name="search" />
        </Button>
        <Select
          className="w-36"
          variant="secondary"
          value={type}
          onChange={(v) => setType(v as string)}
        >
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBox.Item id="" textValue={i18n.t('全部')}>
                {i18n.t('全部')}
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="Maps" textValue={i18n.t('地图')}>
                {i18n.t('地图')}
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="Assets" textValue={i18n.t('资源')}>
                {i18n.t('资源')}
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="Effects" textValue={i18n.t('特效')}>
                {i18n.t('特效')}
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="UI" textValue="UI">
                UI
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="Dialog" textValue={i18n.t('对话')}>
                {i18n.t('对话')}
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="Other/Misc" textValue={i18n.t('其他')}>
                {i18n.t('其他')}
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="Helpers" textValue={i18n.t('辅助')}>
                {i18n.t('辅助')}
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="Skins" textValue={i18n.t('皮肤')}>
                {i18n.t('皮肤')}
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="Mechanics" textValue={i18n.t('机制')}>
                {i18n.t('机制')}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            </ListBox>
          </Select.Popover>
        </Select>
        <Select
          className="w-36"
          variant="secondary"
          value={sort}
          onChange={(v) => setSort(v as any)}
        >
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBox.Item id="new" textValue={i18n.t('最近发布')}>
                {i18n.t('最近发布')}
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="updateAdded" textValue={i18n.t('最近添加')}>
                {i18n.t('最近添加')}
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="updated" textValue={i18n.t('最近更新')}>
                {i18n.t('最近更新')}
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="views" textValue={i18n.t('最多浏览')}>
                {i18n.t('最多浏览')}
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="likes" textValue={i18n.t('最多点赞')}>
                {i18n.t('最多点赞')}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            </ListBox>
          </Select.Popover>
        </Select>
      </div>

      {mods.length > 0 ? (
        mods[0] ? (
          <ModList
            allowUpScroll={currentPage > 1}
            loading={loading}
            mods={mods}
            haveMore={hasMore}
            onLoadMore={useCallback(
              (type: string) =>
                new Promise((rs) => {
                  console.log('load more', type)
                  const forceScroll = async (top: number) => {
                    const list = document.querySelector('.mod-list')!
                    while (list.scrollTop !== top) {
                      list.scrollTo({
                        top: top,
                        behavior: 'instant',
                      })
                      await new Promise((rs) => setTimeout(rs, 10))
                    }
                  }

                  const fadeIn = () => {
                    const list = document.querySelector('.mod-list')!
                    // @ts-ignore
                    list.style.opacity = '1'
                  }

                  const fadeOut = () => {
                    const list = document.querySelector('.mod-list')!
                    // @ts-ignore
                    list.style.opacity = '0'
                  }

                  if (type === 'up') {
                    if (currentPage === 1) return
                    if (loadingLock.current) return
                    loadingLock.current = true
                    fadeOut()
                    setCurrentPage((v) => {
                      fetchModPage(v - 1).then((data) => {
                        const newMods = data.content
                        setHasMore(data.hasNextPage)
                        if (newMods.length === 0) return
                        setMods(newMods)
                        rs(void 0)
                        const list = document.querySelector('.mod-list')! as any
                        const bottomPaddingUpTop =
                          list.scrollTop + list.lastElementChild.offsetTop - list.offsetHeight - 80
                        forceScroll(bottomPaddingUpTop).then(fadeIn)
                      })
                      return v - 1
                    })
                  } else {
                    if (loadingLock.current) return
                    loadingLock.current = true
                    fadeOut()
                    setCurrentPage((v) => {
                      fetchModPage(v + 1).then((data) => {
                        const newMods = data.content
                        setHasMore(data.hasNextPage)
                        if (newMods.length === 0) return
                        setMods(newMods)
                        rs(void 0)
                        forceScroll(40).then(fadeIn)
                      })
                      return v + 1
                    })
                  }
                }),
              [currentPage, type],
            )}
            modFolder={selectedPath + '/Mods'}
          />
        ) : (
          <div className="empty">{i18n.t('加载失败，请重试')}</div>
        )
      ) : loading ? (
        <div className="empty"></div>
      ) : (
        <div className="empty">{i18n.t('无内容')}</div>
      )}
    </Fragment>
  )
}
