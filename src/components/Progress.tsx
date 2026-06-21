import { ProgressBar, ProgressCircle, Label } from '@heroui/react'

export const ProgressIndicator = ({
  infinite,
  value,
  max,
  size = 100,
}: (
  | {
      infinite: true
      value?: void
      max?: void
    }
  | {
      infinite?: false | void
      value: number
      max: number
    }
) & {
  size?: number
  lineWidth?: number
}) => {
  if (infinite) {
    return (
      <ProgressCircle
        aria-label="Loading..."
        isIndeterminate
        size={size >= 80 ? 'lg' : size >= 40 ? 'md' : 'sm'}
      >
        <ProgressCircle.Track>
          <ProgressCircle.FillCircle />
        </ProgressCircle.Track>
      </ProgressCircle>
    )
  }

  // @ts-ignore
  const pct = max > 0 ? Math.round((value / max) * 100) : 0

  return (
    <ProgressCircle
      aria-label={`${pct}%`}
      value={pct}
      size={size >= 80 ? 'lg' : size >= 40 ? 'md' : 'sm'}
    >
      <ProgressCircle.Track>
        <ProgressCircle.FillCircle />
      </ProgressCircle.Track>
    </ProgressCircle>
  )
}

export const ProgressBarIndicator = ({
  value,
  max,
  label,
}: {
  value: number
  max: number
  label?: string
}) => {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <ProgressBar aria-label={label || 'Progress'} value={pct} className="w-full">
      {label && <Label>{label}</Label>}
      <ProgressBar.Output />
      <ProgressBar.Track>
        <ProgressBar.Fill />
      </ProgressBar.Track>
    </ProgressBar>
  )
}
