// import { AbstractPowerSyncDatabase } from '@powersync/web'
// import { v4 as uuidv4 } from 'uuid'
// import {
//   AddBlockChange,
//   DeleteBlockChange,
//   UpdateBlockChange,
//   SkeletonChange
// } from '@renderer/blockUtils/blockDiff/detectDiff'
// import { getBlockContentNode, getChildrenIds } from '@renderer/blockUtils/blockOperations'
// import { Database } from '@renderer/lib/powersync/AppSchema'
// import { Node as pmNode } from 'prosemirror-model'
// import { BlockNoteEditor, nodeToBlock } from '@blocknote/core'
// import { threadId } from 'worker_threads'
// /**
//  * 处理新增区块
//  * @param powersync PowerSync实例
//  * @param changes 区块变化数组
//  * @param userId 用户ID
//  */

// function blockNotdeToDBRecords(node: pmNode): Omit<Database['block'], 'created_at' | 'user_id'> {
//   const contentNode = getBlockContentNode(node)
//   const content = JSON.stringify(contentNode?.content.toJSON())
//   console.log('blockNotdeToDBRecords -> content', contentNode)
//   console.log('blockNotdeToDBRecords -> contentArray', content)
//   //   const props = node.attrs ? JSON.stringify(node.attrs) : JSON.stringify({})
//   //   const type = node.type?.name || 'unknown'
//   const result = {
//     id: node.attrs.id,
//     content: content,
//     props: '',
//     type: ''
//   }
//   console.log('blockNotdeToDBRecords -> result', JSON.stringify(result))

//   return result
// }

// export async function handleAddBlocks(
//   editorInstance: BlockNoteEditor,
//   powersync: AbstractPowerSyncDatabase,
//   changes: AddBlockChange[],
//   userId: string = ''
// ): Promise<void> {
//   const created_at = new Date().toISOString()

//   try {
//     for (const change of changes) {
//       const block = nodeToBlock(
//         change.node,
//         editorInstance.schema.blockSchema,
//         editorInstance.schema.inlineContentSchema,
//         editorInstance.schema.styleSchema,
//         editorInstance.blockCache
//       )
//       const block_table_record: Omit<Database['block'], 'user_id'> = {
//         id: block.id,
//         created_at,
//         content: JSON.stringify(block.content),
//         props: JSON.stringify(block.props),
//         type: block.type
//       }

//       const blocl_to_block_table_records: Omit<Database['block_to_block'], 'user_id'>[] = []
//       for (const child of block.children) {
//         blocl_to_block_table_records.push({
//           id: `${block.id}-${child.id}`,
//           created_at,
//           parent_block_id: block.id,
//           children_block_id: child.id
//         })
//       }
//       //   children: JSON.stringify(block.children.map((child) => child.id))
//       console.log('block.content', typeof block.content)

//       console.log('handleAddBlocks -> record', block_table_record)
//       // 插入区块
//       await powersync.execute(
//         'INSERT INTO block (id, created_at, content, props, type) VALUES (?, ?, ?, ?, ?)',
//         [
//           block_table_record.id,
//           block_table_record.created_at,
//           block_table_record.content,
//           block_table_record.props,
//           block_table_record.type
//         ]
//       )

//       for (const record of blocl_to_block_table_records) {
//         await powersync.execute(
//           'INSERT INTO block_to_block (id, created_at, parent_block_id, children_block_id) VALUES (?, ?, ?, ?)',
//           [record.id, record.created_at, record.parent_block_id, record.children_block_id]
//         )
//       }

//       // 这里需要处理区块与文档的关联，以及区块之间的父子关系
//       // 实际实现中需要根据业务逻辑确定这些关系
//       console.log('新增区块:', block_table_record.id)
//     }
//   } catch (error) {
//     console.error('处理新增区块失败:', error)
//     throw error
//   }
// }

// /**
//  * 处理更新区块
//  * @param powersync PowerSync实例
//  * @param changes 区块变化数组
//  */
// export async function handleUpdateBlocks(
//   editorInstance: BlockNoteEditor,
//   powersync: AbstractPowerSyncDatabase,
//   changes: UpdateBlockChange[]
// ): Promise<void> {
//   const created_at = new Date().toISOString()
//   try {
//     for (const change of changes) {
//       let childre_change = false
//       let other_change = false
//       for (const prop in change.changedProps) {
//         if (prop === 'children') {
//           childre_change = true
//         } else {
//           other_change = true
//         }
//       }

//       if (other_change) {
//         const block = nodeToBlock(
//           change.node,
//           editorInstance.schema.blockSchema,
//           editorInstance.schema.inlineContentSchema,
//           editorInstance.schema.styleSchema,
//           editorInstance.blockCache
//         )
//         const block_table_record: Omit<Database['block'], 'user_id' | 'created_at'> = {
//           id: block.id,
//           content: JSON.stringify(block.content),
//           props: JSON.stringify(block.props),
//           type: block.type
//         }
//         await powersync.execute('UPDATE block SET content = ?, props = ?, type = ? WHERE id = ?', [
//           block_table_record.content,
//           block_table_record.props,
//           block_table_record.type,
//           block_table_record.id
//         ])
//       }

//       if (childre_change) {
//         // children 增加或者减少了
//         const old_children = getChildrenIds(change.oldNode)
//         const new_children = getChildrenIds(change.node)
//         if (change.oldNode.attrs.id !== change.node.attrs.id) {
//           throw new Error('区块id不能改变')
//         }
//         const parent_node_id = change.oldNode.attrs.id
//         const add_children = new_children.filter((id) => !old_children.includes(id))
//         const remove_children = old_children.filter((id) => !new_children.includes(id))

//         // 只需要处理children关系，不用删除block，这是handleDeleteBlocks做的事情
//         for (const child of remove_children) {
//           await powersync.execute(
//             'DELETE FROM block_to_block WHERE parent_block_id = ? AND children_block_id = ?',
//             [parent_node_id, child]
//           )
//         }

//         // 从 block_to_block表新增
//         for (const child of add_children) {
//           await powersync.execute(
//             'INSERT INTO block_to_block (id, created_at, parent_block_id, children_block_id) VALUES (?, ?, ?, ?)',
//             [uuidv4(), created_at, parent_node_id, child]
//           )
//         }
//       }
//     }
//   } catch (error) {
//     console.error('处理更新区块失败:', error)
//     throw error
//   }
// }

// /**
//  * 处理删除区块
//  * @param powersync PowerSync实例
//  * @param changes 区块变化数组
//  */
// export async function handleDeleteBlocks(
//   editorInstance: BlockNoteEditor,
//   powersync: AbstractPowerSyncDatabase,
//   changes: DeleteBlockChange[]
// ): Promise<void> {
//   try {
//     for (const change of changes) {
//       const delete_block_id = change.oldNode.attrs.id
//       await powersync.execute('DELETE FROM block WHERE id = ?', [delete_block_id])
//     }
//     // await powersync.writeTransaction(async (tx) => {
//     //   for (const change of changes) {
//     //     if (change.type !== 'delete') continue
//     //     const { id } = change
//     //     // 删除区块相关联系
//     //     await tx.execute(
//     //       'DELETE FROM block_to_block WHERE parent_block_id = ? OR children_block_id = ?',
//     //       [id, id]
//     //     )
//     //     // 删除区块与文档的关联
//     //     await tx.execute('DELETE FROM doc_block WHERE block_id = ?', [id])
//     //     // 删除区块
//     //     await tx.execute('DELETE FROM block WHERE id = ?', [id])
//     //     console.log('删除区块:', id)
//     //   }
//     // })
//   } catch (error) {
//     console.error('处理删除区块失败:', error)
//     throw error
//   }
// }

// /**
//  * 处理文档骨架变更
//  * @param powersync PowerSync实例
//  * @param changes 区块变化数组
//  */
// export async function handleSkeletonChanges(
//   editorInstance: BlockNoteEditor,
//   powersync: AbstractPowerSyncDatabase,
//   changes: SkeletonChange[],
//   documentId: string
// ): Promise<void> {
//   try {
//     // await powersync.writeTransaction(async (tx) => {
//     //   for (const change of changes) {
//     //     if (change.type !== 'skeleton') continue
//     //     const { oldSkeleton, newSkeleton } = change
//     //     // 删除旧的骨架关系
//     //     // 这里需要实现根据文档骨架重新建立区块之间的关系
//     //     // 可能需要清除之前的关系并重新建立
//     //     console.log('骨架变更:', '旧骨架:', oldSkeleton, '新骨架:', newSkeleton)
//     //     // 示例：重建区块关系
//     //     // 先删除所有相关的区块关系
//     //     // 实际实现时需要根据文档结构和业务逻辑来处理
//     //     if (oldSkeleton.length > 0 && newSkeleton.length > 0) {
//     //       // 这里添加实际的实现逻辑
//     //     }
//     //   }
//     // })
//     if (changes.length > 1) {
//       throw new Error('骨架变更只支持一个区块')
//     }
//     const change = changes[0]
//     const old_block_ids = change.oldSkeleton
//     const new_block_ids = change.newSkeleton
//     const add_children = new_block_ids.filter((id) => !old_block_ids.includes(id))
//     const remove_children = old_block_ids.filter((id) => !new_block_ids.includes(id))
//     console.log('handleSkeletonChanges -> add_children', add_children)
//     console.log('handleSkeletonChanges -> remove_children', remove_children)
//     // 删除旧的骨架关系
//     for (const child of remove_children) {
//       await powersync.execute('DELETE FROM doc_block WHERE doc_id = ? AND block_id = ?', [
//         documentId,
//         child
//       ])
//     }
//     // 新增新的骨架关系
//     for (const child of add_children) {
//       await powersync.execute(
//         'INSERT INTO doc_block (id, created_at, doc_id, block_id) VALUES (?, ?, ?, ?)',
//         [uuidv4(), new Date().toISOString(), documentId, child]
//       )
//     }
//   } catch (error) {
//     console.error('处理骨架变更失败:', error)
//     throw error
//   }
// }
