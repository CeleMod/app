import i18n from 'src/i18n'

import { Icon } from './Icon'
import { callRemote } from '../utils'
import { useGamePath } from 'src/states'
import { Button, Label, ListBox, Select } from '@heroui/react'

export const GameSelector = (props: {
  paths: string[]
  onSelect: (value: string) => void
  launchGame: (v: string) => void
}) => {
  const [gamePath] = useGamePath()

  const allPaths = props.paths.includes(gamePath) ? props.paths : [...props.paths, gamePath]

  return (
    <div className="flex items-center gap-2">
      <Icon name="save" className="shrink-0" />
      <span className="text-sm shrink-0">{i18n.t('选择游戏路径')}</span>
      <Select
        className="w-64"
        variant="secondary"
        placeholder="Select game path"
        value={gamePath || allPaths[0]}
        onChange={(key) => {
          const value = key as string
          if (value === '__other__') {
            props.onSelect('__other__')
          } else {
            props.onSelect(value)
          }
        }}
      >
        <Label>{i18n.t('选择游戏路径')}</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {allPaths.map((p) => (
              <ListBox.Item key={p} id={p} textValue={p}>
                {p}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
            <ListBox.Item key="__other__" id="__other__" textValue={i18n.t('选择其他路径')}>
              {i18n.t('选择其他路径')}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          </ListBox>
        </Select.Popover>
      </Select>

      <Button variant="secondary" onPress={() => props.launchGame('everest')}>
        {i18n.t('Everest')}
      </Button>

      <Button variant="secondary" onPress={() => props.launchGame('origin')}>
        {i18n.t('原版')}
      </Button>

      <Button
        variant="secondary"
        onPress={() => callRemote('open_url', (gamePath || allPaths[0]) + '/Mods')}
      >
        {i18n.t('Mods 文件夹')}
      </Button>
    </div>
  )
}
