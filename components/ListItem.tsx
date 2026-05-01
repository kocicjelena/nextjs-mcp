
import Link from 'next/link'

import { DocEntry } from '@/types/doc-entry'

type Props = {
  data: DocEntry
}

const ListItem = ({ data }: Props) => (
  <Link href="/face/[id]" as={`/face/${data.id}`}>
    {data.id}:{data.text}
  </Link>
)

export default ListItem