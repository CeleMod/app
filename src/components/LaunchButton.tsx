import { Button } from '@heroui/react'
import { ReactNode, useState } from 'react'
import i18n from 'src/i18n'

export function LanuchButton({
  className,
  onClick,
  text,
  startingText,
}: {
  className?: string
  onClick?: (e: any) => void
  text?: ReactNode
  startingText?: ReactNode
}) {
  const [isStarting, setIsStarting] = useState(false)

  function handleStart() {
    setIsStarting(true)

    setTimeout(() => {
      setIsStarting(false)
    }, 4000)
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      className={className}
      isDisabled={isStarting}
      onClick={(e) => {
        onClick?.(e)

        handleStart()
      }}
    >
      {isStarting ? startingText || i18n.t('正在启动') : text || i18n.t('启动')}
    </Button>
  )
}
