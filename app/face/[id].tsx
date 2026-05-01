import { GetStaticProps, GetStaticPaths } from 'next'

import { loadDocs } from '@/lib/mcp/store'
import { useContextState } from '@/context/GlobalContext'
import { DocEntry } from '@/types/doc-entry'
import Layout from '../layout'
import ListDetail from '@/components/ListDetail'

 
type Props = {
  item?: DocEntry
  errors?: string
}

const StaticPropsDetail = ({ item, errors }: Props) => {
  if (errors) {
    return (
      <>
          <span style={{ color: 'red' }}>Error:</span> {errors}
     
      </>
    )
  }

  return (
    <Layout
      // title={`${
      //   item ? item.text : 'Facebook page Detail'
      // } | tools + mcp server`}
    >
      {item && <ListDetail item={item} />}
    </Layout>
  )
}

export default StaticPropsDetail

export const getStaticPaths: GetStaticPaths = async () => {
  // Get the paths we want to pre-render based on facebook page (interaction by tool)
  // thiswont work
  const { pdf } = useContextState();
  // this will work
  const docs = await loadDocs();
  const paths = pdf.entries?.map((user) => ({
    params: { id: user.id.toString() },
  }))

  // We'll pre-render only these paths at build time.
  // { fallback: false } means other routes should 404.
  return { paths, fallback: false }
}

// This function gets called at build time on server-side.
// It won't be called on client-side, so you can even do
// direct database queries.
export const getStaticProps: GetStaticProps = async ({ params }) => {
   const { pdf } = useContextState();
 
  try {
    const id = params?.id
    const item = pdf.entries.find((data) => data.id === Number(id))
    // By returning { props: item }, the StaticPropsDetail component
    // will receive `item` as a prop at build time
    return { props: { item } }
  } catch (err: any) {
    return { props: { errors: err.message } }
  }
}