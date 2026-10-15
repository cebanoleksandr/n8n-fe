import { useMemo, type FC } from 'react'
import type { StoredItem } from '../../api/types'
import CodeEditor from '../code-editor/CodeEditor'

/** Items as JSON (each item's `json`, as expressions see it), read-only. */
const ItemsJson: FC<{ items: StoredItem[] }> = ({ items }) => {
  const text = useMemo(() => JSON.stringify(items.map((item) => item.json), null, 2), [items])
  return (
    <CodeEditor
      value={text}
      onChange={() => {}}
      language="json"
      code
      readOnly
      // The column scrolls, not the editor.
      maxHeight={null}
    />
  )
}

export default ItemsJson
