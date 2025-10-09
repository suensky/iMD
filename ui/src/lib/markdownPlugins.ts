type MdastNode = {
  type: string
  children?: MdastNode[]
  value?: string
  align?: Array<'left' | 'right' | 'center' | null>
  data?: Record<string, unknown>
}

type TableData = {
  header: string[]
  align: Array<'left' | 'right' | 'center' | null>
  rows: string[][]
  caption?: string
}

function cloneNode<T extends MdastNode>(node: T): T {
  return JSON.parse(JSON.stringify(node))
}

function isParagraph(node: MdastNode | undefined): node is MdastNode {
  return !!node && node.type === 'paragraph' && Array.isArray(node.children)
}

function collectText(node: MdastNode): string {
  if (!node) return ''
  if (typeof node.value === 'string') return node.value
  if (!node.children) return ''
  return node.children.map(child => collectText(child)).join('')
}

function paragraphToLines(node: MdastNode): string[] {
  if (!node.children) return []
  const lines: string[] = []
  let current = ''
  for (const child of node.children) {
    if (child.type === 'text' || child.type === 'inlineCode' || child.type === 'emphasis' || child.type === 'strong' || child.type === 'delete') {
      current += collectText(child)
    } else if (child.type === 'break') {
      lines.push(current)
      current = ''
    } else {
      current += collectText(child)
    }
  }
  lines.push(current)
  return lines
}

function paragraphToText(node: MdastNode): string {
  return paragraphToLines(node).join('\n')
}

function normalizeCellLines(value: string): MdastNode[] {
  const lines = value.split('\n')
  const result: MdastNode[] = []
  lines.forEach((line, index) => {
    result.push({ type: 'text', value: line })
    if (index < lines.length - 1) {
      result.push({ type: 'break' })
    }
  })
  return result
}

function parseAlignToken(token: string): 'left' | 'right' | 'center' | null {
  const trimmed = token.trim()
  const starts = trimmed.startsWith(':')
  const ends = trimmed.endsWith(':')
  if (starts && ends) return 'center'
  if (starts) return 'left'
  if (ends) return 'right'
  return null
}

function isDivider(line: string): boolean {
  const trimmed = line.trim()
  return trimmed.length > 0 && /^[-\s:]+$/.test(trimmed)
}

function isEmpty(line: string): boolean {
  return line.trim().length === 0
}

function splitCells(line: string, expected: number): string[] {
  const raw = line.split(/ {2,}/)
  if (raw.length < expected) {
    while (raw.length < expected) raw.push('')
  }
  if (raw.length > expected) raw.length = expected
  return raw.map(cell => cell.trim())
}

function splitCellsPreserve(line: string, expected: number): string[] {
  const raw = line.split(/ {2,}/)
  if (raw.length < expected) {
    while (raw.length < expected) raw.push('')
  }
  if (raw.length > expected) raw.length = expected
  return raw
}

function parseSimpleTable(lines: string[]): TableData | null {
  if (lines.length < 2) return null
  const headerLine = lines[0]
  const dividerLine = lines[1]
  if (!isDivider(dividerLine)) return null
  const headerCells = splitCells(headerLine, headerLine.split(/ {2,}/).length)
  if (headerCells.length < 2) return null
  const alignChunks = splitCells(dividerLine, headerCells.length)
  const align = alignChunks.map(parseAlignToken)
  const rows: string[][] = []
  let currentRow: string[] | null = null
  for (let index = 2; index < lines.length; index++) {
    const rawLine = lines[index]
    if (isDivider(rawLine)) {
      if (currentRow) {
        rows.push(currentRow.map(cell => cell.trim()))
        currentRow = null
      }
      continue
    }
    if (isEmpty(rawLine)) {
      if (currentRow) {
        rows.push(currentRow.map(cell => cell.trim()))
        currentRow = null
      }
      continue
    }
    const rawCells = splitCellsPreserve(rawLine, headerCells.length)
    const firstNonEmpty = rawCells.findIndex(value => value.trim().length > 0)
    if (firstNonEmpty === 0 || !currentRow) {
      if (currentRow) rows.push(currentRow.map(cell => cell.trim()))
      currentRow = rawCells.map(cell => cell.trim())
    } else if (currentRow) {
      rawCells.forEach((fragment, cellIndex) => {
        const trimmed = fragment.trim()
        if (!trimmed) return
        currentRow![cellIndex] = currentRow![cellIndex]
          ? `${currentRow![cellIndex]}\n${trimmed}`
          : trimmed
      })
    }
  }
  if (currentRow) rows.push(currentRow.map(cell => cell.trim()))
  if (rows.length === 0) return null
  return { header: headerCells.map(cell => cell.trim()), align, rows }
}

function parseGridTable(lines: string[]): TableData | null {
  if (lines.length < 4) return null
  if (!isDivider(lines[0]) || !isDivider(lines[2])) return null
  const headerLine = lines[1]
  const headerCells = splitCells(headerLine, headerLine.split(/ {2,}/).length)
  if (headerCells.length < 2) return null
  const align = headerCells.map(() => null)
  const rows: string[][] = []
  let currentRow: string[] | null = null
  for (let index = 3; index < lines.length; index++) {
    const line = lines[index]
    if (isDivider(line)) {
      if (currentRow) {
        rows.push(currentRow.map(cell => cell.trim()))
        currentRow = null
      }
      continue
    }
    if (isEmpty(line)) {
      if (currentRow) {
        rows.push(currentRow.map(cell => cell.trim()))
        currentRow = null
      }
      continue
    }
    const rawCells = splitCellsPreserve(line, headerCells.length)
    const firstNonEmpty = rawCells.findIndex(value => value.trim().length > 0)
    if (firstNonEmpty === 0 || !currentRow) {
      if (currentRow) rows.push(currentRow.map(cell => cell.trim()))
      currentRow = rawCells.map(cell => cell.trim())
    } else if (currentRow) {
      rawCells.forEach((fragment, cellIndex) => {
        const trimmed = fragment.trim()
        if (!trimmed) return
        currentRow![cellIndex] = currentRow![cellIndex]
          ? `${currentRow![cellIndex]}\n${trimmed}`
          : trimmed
      })
    }
  }
  if (currentRow) rows.push(currentRow.map(cell => cell.trim()))
  if (rows.length === 0) return null
  return { header: headerCells.map(cell => cell.trim()), align, rows }
}

function linesAreTableCandidate(lines: string[]): boolean {
  const nonEmpty = lines.filter(line => !isEmpty(line))
  if (nonEmpty.length < 2) return false
  if (isDivider(nonEmpty[0]) && nonEmpty.length >= 4) return true
  if (!isDivider(nonEmpty[0]) && isDivider(nonEmpty[1])) return true
  return false
}

function createTableNode(data: TableData): MdastNode {
  const headerRow: MdastNode = {
    type: 'tableRow',
    children: data.header.map(value => ({
      type: 'tableCell',
      children: normalizeCellLines(value),
    })),
  }
  const bodyRows = data.rows.map(row => ({
    type: 'tableRow',
    children: row.map(value => ({
      type: 'tableCell',
      children: normalizeCellLines(value),
    })),
  }))
  return {
    type: 'table',
    align: data.align,
    children: [headerRow, ...bodyRows],
    data: data.caption ? { caption: data.caption } : undefined,
  }
}

function stripDefinitionMarker(children: MdastNode[]): MdastNode[] {
  if (children.length === 0) return []
  const cloned = children.map(child => cloneNode(child))
  const first = cloned[0]
  if (first.type === 'text' && typeof first.value === 'string') {
    first.value = first.value.replace(/^\s*:\s?/, '')
    if (!first.value.length) cloned.shift()
  }
  return cloned
}

function makeLineBlocks(node: MdastNode) {
  if (!isParagraph(node)) return
  const lines = paragraphToLines(node)
  if (lines.length < 1) return
  const marker = '__LINE_BLOCK__'
  const trimmedLines = lines
    .map(line => line.replace(/^\s*\| ?/, marker))
    .filter(line => line.includes(marker))
  if (trimmedLines.length !== lines.length) return
  const children: MdastNode[] = []
  trimmedLines.forEach((line, index) => {
    const content = line.replace(marker, '')
    const leading = content.match(/^ +/)
    let display = content
    if (leading) {
      const pad = '\u00a0'.repeat(leading[0].length)
      display = pad + content.slice(leading[0].length)
    }
    children.push({ type: 'text', value: display })
    if (index < trimmedLines.length - 1) children.push({ type: 'break' })
  })
  node.children = children
  node.data = Object.assign({}, node.data, {
    hName: 'p',
    hProperties: { className: 'markdown-line-block' },
  })
}

type SubSupSegment = { type: 'text'; value: string } | { type: 'subscript' | 'superscript'; value: string }

function splitInlineDelimitedSegments(
  value: string,
  marker: string,
  variant: 'subscript' | 'superscript',
): SubSupSegment[] | null {
  let index = 0
  let lastIndex = 0
  const segments: SubSupSegment[] = []
  let mutated = false
  while (index < value.length) {
    if (value[index] !== marker) {
      index += 1
      continue
    }
    if (value[index + 1] === marker) {
      index += 1
      continue
    }
    let escapeCount = 0
    for (let back = index - 1; back >= 0 && value[back] === '\\'; back -= 1) {
      escapeCount += 1
    }
    if (escapeCount % 2 === 1) {
      index += 1
      continue
    }
    let searchIndex = index + 1
    let closing = -1
    while (searchIndex < value.length) {
      const next = value.indexOf(marker, searchIndex)
      if (next === -1) break
      let escapes = 0
      for (let back = next - 1; back >= index + 1 && value[back] === '\\'; back -= 1) {
        escapes += 1
      }
      if (escapes % 2 === 0) {
        closing = next
        break
      }
      searchIndex = next + 1
    }
    if (closing === -1) {
      index += 1
      continue
    }
    const inner = value.slice(index + 1, closing)
    if (!inner.trim()) {
      index = closing + 1
      continue
    }
    if (index > lastIndex) {
      segments.push({ type: 'text', value: value.slice(lastIndex, index) })
    }
    segments.push({ type: variant, value: inner })
    mutated = true
    index = closing + 1
    lastIndex = index
  }
  if (!mutated) return null
  if (lastIndex < value.length) {
    segments.push({ type: 'text', value: value.slice(lastIndex) })
  }
  return segments
}

function mapSubSupSegmentToNode(segment: SubSupSegment): MdastNode {
  if (segment.type === 'text') {
    return { type: 'text', value: segment.value }
  }
  const tagName = segment.type === 'subscript' ? 'sub' : 'sup'
  const className = segment.type === 'subscript' ? 'markdown-subscript' : 'markdown-superscript'
  return {
    type: segment.type,
    children: [{ type: 'text', value: segment.value }],
    data: {
      hName: tagName,
      hProperties: { className },
    },
  }
}

function transformSubSuperscript(node: MdastNode) {
  if (!node.children) return
  let index = 0
  while (index < node.children.length) {
    const child = node.children[index]
    if (child.type === 'code' || child.type === 'inlineCode' || child.type === 'math' || child.type === 'inlineMath') {
      index += 1
      continue
    }
    if (child.type === 'text' && typeof child.value === 'string') {
      const subSegments = splitInlineDelimitedSegments(child.value, '~', 'subscript')
      if (subSegments) {
        const replacements = subSegments.map(mapSubSupSegmentToNode)
        node.children.splice(index, 1, ...replacements)
        continue
      }
      const supSegments = splitInlineDelimitedSegments(child.value, '^', 'superscript')
      if (supSegments) {
        const replacements = supSegments.map(mapSubSupSegmentToNode)
        node.children.splice(index, 1, ...replacements)
        continue
      }
    }
    if (child.children) transformSubSuperscript(child)
    index += 1
  }
}

const EMOJI_SHORTCODES: Record<string, string> = {
  '100': '💯',
  '+1': '👍',
  '-1': '👎',
  angry: '😠',
  blush: '😊',
  blue_heart: '💙',
  boom: '💥',
  clap: '👏',
  cry: '😢',
  eyes: '👀',
  expressionless: '😑',
  facepalm: '🤦',
  fire: '🔥',
  green_heart: '💚',
  grin: '😁',
  grinning: '😀',
  heart: '❤️',
  heart_eyes: '😍',
  hushed: '😯',
  joy: '😂',
  laugh: '😂',
  laughing: '😆',
  neutral_face: '😐',
  orange_heart: '🧡',
  poop: '💩',
  pray: '🙏',
  purple_heart: '💜',
  rage: '😡',
  relaxed: '☺️',
  rolling_on_the_floor_laughing: '🤣',
  rocket: '🚀',
  scream: '😱',
  sleeping: '😴',
  smile: '😄',
  smiley: '😃',
  smirk: '😏',
  sob: '😭',
  star: '⭐️',
  sunglasses: '😎',
  sweat_smile: '😅',
  tada: '🎉',
  thinking: '🤔',
  thumbsup: '👍',
  thumbsdown: '👎',
  wave: '👋',
  wink: '😉',
  white_check_mark: '✅',
  x: '❌',
  yellow_heart: '💛',
  zap: '⚡️',
}

function replaceEmojiShortcodes(value: string): string {
  return value.replace(/:([a-z0-9_+-]+):/gi, (match, name) => {
    const normalized = name.toLowerCase()
    return EMOJI_SHORTCODES[normalized] ?? match
  })
}

function transformEmoji(node: MdastNode) {
  if (!node.children) return
  for (const child of node.children) {
    if (child.type === 'code' || child.type === 'inlineCode' || child.type === 'math' || child.type === 'inlineMath') {
      continue
    }
    if (child.type === 'text' && typeof child.value === 'string') {
      const nextValue = replaceEmojiShortcodes(child.value)
      if (nextValue !== child.value) child.value = nextValue
    }
    if (child.children) transformEmoji(child)
  }
}

function transformSmartPunctuation(node: MdastNode) {
  if (!node.children) return
  for (const child of node.children) {
    if (child.type === 'code' || child.type === 'inlineCode') continue
    if (child.type === 'text' && typeof child.value === 'string') {
      let value = child.value
      value = value.replace(/\.\.\./g, '…')
      value = value.replace(/---/g, '—')
      value = value.replace(/--/g, '–')
      child.value = value
    }
    transformSmartPunctuation(child)
  }
}

export function remarkPandocTables() {
  return (tree: MdastNode & { children?: MdastNode[] }) => {
    if (!tree.children) return
    for (let index = 0; index < tree.children.length; index++) {
      const node = tree.children[index]
      if (!isParagraph(node)) continue
      const lines = paragraphToLines(node)
      if (!linesAreTableCandidate(lines)) continue
      const tableData = isDivider(lines[0].trim())
        ? parseGridTable(lines)
        : parseSimpleTable(lines)
      if (!tableData) continue
      const nextNode = tree.children[index + 1]
      if (isParagraph(nextNode)) {
        const captionText = paragraphToText(nextNode).trim()
        if (/^Table:\s*/i.test(captionText)) {
          tableData.caption = captionText.replace(/^Table:\s*/i, '').trim()
          tree.children.splice(index + 1, 1)
        }
      }
      const tableNode = createTableNode(tableData)
      tree.children.splice(index, 1, tableNode)
    }
  }
}

export function remarkDefinitionLists() {
  return (tree: MdastNode & { children?: MdastNode[] }) => {
    if (!tree.children) return
    const result: MdastNode[] = []
    for (let index = 0; index < tree.children.length; index++) {
      const node = tree.children[index]
      if (!isParagraph(node)) {
        result.push(node)
        continue
      }
      const termText = paragraphToText(node).trim()
      if (!termText) {
        result.push(node)
        continue
      }
      const dlNode: MdastNode = {
        type: 'definitionList',
        children: [],
        data: { hName: 'dl', hProperties: { className: 'markdown-definition-list' } },
      }
      let cursor = index
      let consumedAny = false
      while (cursor < tree.children.length) {
        const termNode = tree.children[cursor]
        if (!isParagraph(termNode)) break
        const possibleTerm = paragraphToText(termNode).trim()
        if (!possibleTerm) break
        const definitionNodes: MdastNode[] = []
        let defIndex = cursor + 1
        while (defIndex < tree.children.length) {
          const defCandidate = tree.children[defIndex]
          if (!isParagraph(defCandidate)) break
          const defText = paragraphToText(defCandidate)
          if (!defText.trim().startsWith(':')) break
          definitionNodes.push(defCandidate)
          defIndex += 1
        }
        if (definitionNodes.length === 0) break
        consumedAny = true
        const dtNode: MdastNode = cloneNode(termNode)
        dtNode.data = Object.assign({}, dtNode.data, { hName: 'dt' })
        dlNode.children!.push(dtNode)
        definitionNodes.forEach(definition => {
          const ddNode: MdastNode = {
            type: 'paragraph',
            children: stripDefinitionMarker(definition.children ?? []),
            data: { hName: 'dd' },
          }
          dlNode.children!.push(ddNode)
        })
        cursor = defIndex
        while (cursor < tree.children.length) {
          const maybeBlank = tree.children[cursor]
          if (isParagraph(maybeBlank) && !paragraphToText(maybeBlank).trim()) {
            cursor += 1
            continue
          }
          break
        }
      }
      if (!consumedAny) {
        result.push(node)
        continue
      }
      result.push(dlNode)
      index = cursor - 1
    }
    tree.children = result
  }
}

export function remarkLineBlocks() {
  return (tree: MdastNode & { children?: MdastNode[] }) => {
    if (!tree.children) return
    tree.children.forEach(node => {
      if (isParagraph(node)) {
        makeLineBlocks(node)
      }
    })
  }
}

export function remarkSubSuperscript() {
  return (tree: MdastNode & { children?: MdastNode[] }) => {
    if (!tree.children) return
    transformSubSuperscript(tree)
  }
}

export function remarkEmoji() {
  return (tree: MdastNode & { children?: MdastNode[] }) => {
    if (!tree.children) return
    transformEmoji(tree)
  }
}

export function remarkSmartPunctuation() {
  return (tree: MdastNode & { children?: MdastNode[] }) => {
    if (!tree.children) return
    transformSmartPunctuation(tree)
  }
}
