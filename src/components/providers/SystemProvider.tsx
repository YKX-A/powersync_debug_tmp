// import { configureFts } from '@/app/utils/fts_setup';
// import { useSupabase } from '@renderer/lib/powersync/PowerSyncContext'
// import { CircularProgress } from '@mui/material'
import { PowerSyncContext } from '@powersync/react'
import Logger from 'js-logger'
import React, { Suspense } from 'react'
import { SupabaseContext, db } from './context'
import { SupabaseConnector } from '../../powersync/BackendConnector'
// import { NavigationPanelContextProvider } from '../../navigation/NavigationPanelContext'

export const SystemProvider = ({ children }: { children: React.ReactNode }): React.ReactElement => {
  const [supabaseConnector] = React.useState(new SupabaseConnector())
  const [powerSync] = React.useState(db)

  React.useEffect(() => {
    // Lint工具因为它的名称而将其误认为是一个hook
    Logger.useDefaults(); // eslint-disable-line
    Logger.setLevel(Logger.DEBUG)
    // 用于控制台测试目的
    ;(window as Window & typeof globalThis & { _powersync: typeof db })._powersync = powerSync

    console.log('start init PowerSync...')

    // 添加错误处理
    powerSync.init().catch((error) => {
      console.error('PowerSync init failed:', error)
    })

    const l = supabaseConnector.registerListener({
      initialized: () => {
        console.log('connector initialized')
      },
      sessionStarted: (session) => {
        console.log('session started', session?.expires_at)
        // 添加错误处理
        console.log('start connecting PowerSync...')
        powerSync.connect(supabaseConnector)
        console.log('PowerSync connected to backend')
      }
    })

    console.log('start init connector...')
    supabaseConnector.init().catch((error) => {
      console.error('connector init failed:', error)
    })

    return (): void => {
      console.log('清理PowerSync资源...')
      l?.()
    }
  }, [powerSync, supabaseConnector])

  return (
    <Suspense >
      <PowerSyncContext.Provider value={powerSync}>
        <SupabaseContext.Provider value={supabaseConnector}>{children}</SupabaseContext.Provider>
      </PowerSyncContext.Provider>
    </Suspense>
  )
}

export default SystemProvider
