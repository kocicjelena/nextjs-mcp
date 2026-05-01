import * as React from 'react'
import { DocEntry } from '@/types/doc-entry'
import ListItem from './ListItem'

type Props = {
  items: DocEntry[]
}

const List = ({ items }: Props) => (
  <ul>
    {items.map((item) => (
      <li key={item.id}>
        <ListItem data={item} />
      </li>
    ))}
  </ul>
)

export default List