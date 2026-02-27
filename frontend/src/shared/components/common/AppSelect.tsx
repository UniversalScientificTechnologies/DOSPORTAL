import ReactSelect, { type Props as ReactSelectProps } from 'react-select'
import { theme } from '@/theme'

export type SelectOption = { value: string; label: string }

const buildStyles = () => ({
  control: (base: object) => ({
    ...base,
    background: theme.colors.bg,
    borderColor: theme.colors.border,
    borderRadius: theme.borders.radius.sm,
    fontSize: theme.typography.fontSize.base,
    minHeight: 'unset',
    boxShadow: 'none',
    '&:hover': { borderColor: theme.colors.primary },
  }),
  option: (base: object, state: { isFocused: boolean }) => ({
    ...base,
    background: state.isFocused ? theme.colors.infoBg : theme.  colors.bg,
    color: theme.colors.textDark,
    fontSize: theme.typography.fontSize.base,
  }),
  menu: (base: object) => ({ ...base, zIndex: 20 }),
  singleValue: (base: object) => ({ ...base, color: theme.colors.textDark }),
  placeholder: (base: object) => ({ ...base, color: theme.colors.muted }),
  multiValue: (base: object) => ({ ...base, background: theme.colors.mutedLighter }),
  multiValueLabel: (base: object) => ({ ...base, color: theme.colors.textDark }),
  multiValueRemove: (base: object) => ({
    ...base,
    color: theme.colors.danger,
    '&:hover': { background: theme.colors.mutedLighter, color: theme.colors.danger },
  }),
})

type AppSelectProps<IsMulti extends boolean = false> = ReactSelectProps<SelectOption, IsMulti>

export function AppSelect<IsMulti extends boolean = false>(props: AppSelectProps<IsMulti>) {
  return <ReactSelect<SelectOption, IsMulti> styles={buildStyles()} {...props} />
}
