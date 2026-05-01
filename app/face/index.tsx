import { GetStaticProps } from 'next'
import Link from 'next/link'

import { useContextState } from '@/context/GlobalContext'
import { DocEntry } from '@/types/doc-entry'
import Layout from '../layout'
import List from '@/components/List'

type Props = {
  items: DocEntry[]
}

const WithStaticProps = ({ items }: Props) => (
  <Layout>
    <h1>Users List</h1>
    <p>
      Example fetching data from inside <code>getStaticProps()</code>.
    </p>
    <p>You are currently on: /face</p>
    <List items={items} />
    <p>
      <Link href="/">Go home</Link>
    </p>
  </Layout>
)

export const getStaticProps: GetStaticProps = async () => {
  // Example for including static props in a Next.js function component page.
  // Don't forget to include the respective types for any props passed into
  // the component.
    const { pdf } = useContextState();
  
  const items: DocEntry[] = pdf.entries
  return { props: { items } }
}

export default WithStaticProps