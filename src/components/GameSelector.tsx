import i18n from 'src/i18n'

import { Icon } from './Icon'
import { callRemote } from '../utils'
import { useGamePath } from 'src/states'
import { Button, Heading, ListBox, Select } from '@heroui/react'
import { LanuchButton } from './LaunchButton'

export const GameSelector = (props: {
  paths: string[]
  onSelect: (value: string) => void
  launchGame: (v: string) => void
}) => {
  const [gamePath] = useGamePath()

  const allPaths = props.paths.includes(gamePath) ? props.paths : [...props.paths, gamePath]

  return (
    <div>
      <Heading level={2} className="flex items-center gap-2 text-base">
        <Icon name="save" /> {i18n.t('选择游戏路径')}
      </Heading>

      <div className="flex items-center gap-2 mt-2">
        <Select
          variant="secondary"
          placeholder={i18n.t('选择游戏路径')}
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
      </div>

      <div className="flex items-center gap-x-1 mt-2">
        <LanuchButton
          text={i18n.t('Everest')}
          onClick={() => {
            props.launchGame('everest')
          }}
        />

        <LanuchButton
          text={i18n.t('原版')}
          onClick={() => {
            props.launchGame('origin')
          }}
        />

        <Button
          variant="secondary"
          onPress={() => callRemote('open_url', (gamePath || allPaths[0]) + '/Mods')}
        >
          {i18n.t('Mods 文件夹')}
        </Button>
      </div>
    </div>
  )
}
