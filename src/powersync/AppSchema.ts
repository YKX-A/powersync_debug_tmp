import { column, Schema, Table } from '@powersync/web'
// OR: import { column, Schema, Table } from '@powersync/react-native';

const doc_block = new Table(
  {
    // id column (text) is automatically included
    created_at: column.text,
    doc_id: column.text,
    block_id: column.text,
    user_id: column.text
  },
  { indexes: {} }
)

const block_to_block = new Table(
  {
    // id column (text) is automatically included
    created_at: column.text,
    user_id: column.text,
    parent_block_id: column.text,
    children_block_id: column.text
  },
  { indexes: {} }
)

const block = new Table(
  {
    // id column (text) is automatically included
    created_at: column.text,
    content: column.text,
    props: column.text,
    type: column.text,
    user_id: column.text
  },
  { indexes: {} }
)

const test_pc = new Table(
  {
    // id column (text) is automatically included
    created_at: column.text,
    content: column.text,
    user_id: column.text
  },
  { indexes: {} }
)

export const AppSchema = new Schema({
  doc_block,
  block_to_block,
  block,
  test_pc
})

export type Database = (typeof AppSchema)['types']
