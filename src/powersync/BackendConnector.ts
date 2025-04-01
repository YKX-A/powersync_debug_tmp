import {
  AbstractPowerSyncDatabase,
  BaseObserver,
  CrudEntry,
  PowerSyncBackendConnector,
  UpdateType,
  type PowerSyncCredentials
} from '@powersync/web'

import { Session, SupabaseClient, createClient } from '@supabase/supabase-js'

export type SupabaseConfig = {
  supabaseUrl: string
  supabaseAnonKey: string
  powersyncUrl: string
}

/// Postgres Response codes that we cannot recover from by retrying.
const FATAL_RESPONSE_CODES = [
  // Class 22 — Data Exception
  // Examples include data type mismatch.
  new RegExp('^22...$'),
  // Class 23 — Integrity Constraint Violation.
  // Examples include NOT NULL, FOREIGN KEY and UNIQUE violations.
  new RegExp('^23...$'),
  // INSUFFICIENT PRIVILEGE - typically a row-level security violation
  new RegExp('^42501$')
]

export type SupabaseConnectorListener = {
  initialized: () => void
  sessionStarted: (session: Session) => void
}

export class SupabaseConnector
  extends BaseObserver<SupabaseConnectorListener>
  implements PowerSyncBackendConnector {
  readonly client: SupabaseClient
  readonly config: SupabaseConfig

  ready: boolean

  currentSession: Session | null

  constructor() {
    super()
    this.config = {
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      powersyncUrl: import.meta.env.VITE_POWERSYNC_URL,
      supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY
    }

    this.client = createClient(this.config.supabaseUrl, this.config.supabaseAnonKey, {
      auth: {
        persistSession: true
      }
    })
    this.currentSession = null
    this.ready = false

    console.log('SupabaseConnector constructor done')
    console.log({
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      powersyncUrl: import.meta.env.VITE_POWERSYNC_URL,
      supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY
    })
  }

  async init() {
    console.log('SupabaseConnector init')
    if (this.ready) {
      return
    }

    const sessionResponse = await this.client.auth.getSession()
    this.updateSession(sessionResponse.data.session)
    console.log('SupabaseConnector init done')
    this.ready = true
    this.iterateListeners((cb) => cb.initialized?.())
  }

  async login(username: string, password: string) {
    console.log('SupabaseConnector login')
    const {
      data: { session },
      error
    } = await this.client.auth.signInWithPassword({
      email: username,
      password: password
    })

    if (error) {
      throw error
    }

    this.updateSession(session)
  }

  async fetchCredentials() {
    console.log('SupabaseConnector fetchCredentials')
    const {
      data: { session },
      error
    } = await this.client.auth.getSession()
    console.log('SupabaseConnector fetchCredentials', session, error)

    if (!session || error) {
      throw new Error(`Could not fetch Supabase credentials: ${error}`)
    }

    console.debug('Session expires at', session.expires_at)
    console.debug('Session access_token', session.access_token)
    return {
      endpoint: this.config.powersyncUrl,
      token: session.access_token ?? ''
    } satisfies PowerSyncCredentials
  }

  // async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
  //   console.log('uploadData', database)
  // }

  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    const transaction = await database.getNextCrudTransaction()

    if (!transaction) {
      return
    }

    let lastOp: CrudEntry | null = null
    try {
      // Note: If transactional consistency is important, use database functions
      // or edge functions to process the entire transaction in a single call.
      for (const op of transaction.crud) {
        lastOp = op
        const table = this.client.from(op.table)
        let result: { error?: { message: string } } = {}

        if (op.op === UpdateType.PUT) {
          console.log('Operation', op.opData)
          const record: Record<string, any> = { ...op.opData, id: op.id }
          // Process JSON fields - special handling for content and props fields in the block table
          if (op.table === 'block') {
            // Process content field
            const jsonFields = ['content', 'props']
            for (const key of jsonFields) {
              if (record[key] != null) {
                // Try to parse JSON string into object
                record[key] = JSON.parse(record[key])
                console.log('Processed JSON field', record[key])
              }
            }
          }
          result = await table.upsert(record)
        } else if (op.op === UpdateType.PATCH) {
          const record: Record<string, any> = { ...op.opData }
          if (op.table === 'block') {
            // Process content field
            const jsonFields = ['content', 'props']
            for (const key of jsonFields) {
              if (record[key] != null) {
                // Try to parse JSON string into object
                record[key] = JSON.parse(record[key])
                console.log('Processed JSON field', record[key])
              }
            }
          }
          result = await table.update(record).eq('id', op.id)
        } else if (op.op === UpdateType.DELETE) {
          console.log('Delete operation', op, op.opData, op.id)
          result = await table.delete().eq('id', op.id)
        }

        if (result.error) {
          console.error(result.error)
          result.error.message = `Could not update Supabase. Received error: ${result.error.message}`
          throw result.error
        }
      }

      await transaction.complete()
    } catch (ex: any) {
      console.debug(ex)
      if (typeof ex.code == 'string' && FATAL_RESPONSE_CODES.some((regex) => regex.test(ex.code))) {
        /**
         * Instead of blocking the queue with these errors,
         * discard the (rest of the) transaction.
         *
         * Note that these errors typically indicate a bug in the application.
         * If protecting against data loss is important, save the failing records
         * elsewhere instead of discarding, and/or notify the user.
         */
        console.error('Data upload error - discarding:', lastOp, ex)
        await transaction.complete()
      } else {
        // Error may be retryable - e.g. network error or temporary server error.
        // Throwing an error here causes this call to be retried after a delay.
        throw ex
      }
    }
  }

  updateSession(session: Session | null) {
    this.currentSession = session
    if (!session) {
      return
    }
    this.iterateListeners((cb) => cb.sessionStarted?.(session))
  }
}
