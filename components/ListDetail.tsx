import * as React from 'react'

import { DocEntry } from '@/types/doc-entry'

type ListDetailProps = {
  item: DocEntry
}

const ListDetail = ({ item: user }: ListDetailProps) => (
  <div>
    <h1>Detail for {user.text}</h1>
    <p>ID: {user.id}</p>
  </div>
)

export default ListDetail