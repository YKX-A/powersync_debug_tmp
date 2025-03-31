import { useState, useEffect } from 'react'
import { usePowerSync } from '@powersync/react'
import { Database } from '../../AppSchema'
import { QueryResult } from '@powersync/web'

// 更新类型定义以匹配新的查询结果
type DocBlock = Database['doc_block']
type DocumentResult = Pick<DocBlock, 'user_id' | 'doc_id' | 'created_at'>

/**
 * 获取所有文档的hook
 * @returns {object} 文档列表和加载状态
 */
export function useDocuments(): { documents: DocumentResult[]; loading: boolean } {
  const [documents, setDocuments] = useState<DocumentResult[]>([])
  const [loading, setLoading] = useState(true)
  const powersync = usePowerSync()

  useEffect(() => {
    // 创建中止控制器用于清理
    const controller = new AbortController()

    // 使用PowerSync的watch方法实时监听文档列表变化，使用新的SQL查询
    powersync.watch(
      'SELECT user_id, doc_id, MAX(created_at) as created_at FROM doc_block GROUP BY user_id, doc_id',
      [],
      {
        onResult: (results: QueryResult) => {
          // 将结果转换为正确的类型
          console.log('useDocuments results', results)
          // 正确访问查询结果的rows属性
          const typedResults = (results.rows?._array as DocumentResult[]) || []
          setDocuments(typedResults)
          setLoading(false)
        },
        onError: (error) => {
          console.error('获取文档列表失败:', error)
          setLoading(false)
        }
      },
      { signal: controller.signal, tables: ['doc_block'] }
    )

    // 组件卸载时取消订阅
    return (): void => {
      controller.abort()
    }
  }, [powersync])

  return { documents, loading }
}
