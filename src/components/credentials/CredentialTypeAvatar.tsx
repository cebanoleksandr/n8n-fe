import type { FC } from 'react'
import Avatar from '@mui/material/Avatar'

// Theme palette colors; a type always gets the same one.
const COLORS = ['primary', 'secondary', 'info', 'success', 'warning', 'error'] as const

function colorFor(type: string) {
  let hash = 0
  for (const char of type) hash = (hash * 31 + char.charCodeAt(0)) | 0
  return COLORS[Math.abs(hash) % COLORS.length]
}

interface IProps {
  type: string
  displayName: string
  size?: number
}

/** The API has no icons for credential types: a colored initial stands in. */
const CredentialTypeAvatar: FC<IProps> = ({ type, displayName, size = 32 }) => {
  const color = colorFor(type)
  return (
    <Avatar
      variant="rounded"
      sx={{
        width: size,
        height: size,
        fontSize: size * 0.45,
        fontWeight: 700,
        bgcolor: `${color}.main`,
        color: `${color}.contrastText`,
      }}
    >
      {displayName.charAt(0).toUpperCase()}
    </Avatar>
  )
}

export default CredentialTypeAvatar
