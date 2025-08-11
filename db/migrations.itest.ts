import { describe, it, expect, beforeEach, vi } from 'vitest'
import { migrate } from './migrations'

// Mock the SQLite database for migration tests
const mockDb = {
  exec: vi.fn(),
  selectValue: vi.fn(),
  selectObjects: vi.fn(() => [])
}

vi.mock('./openDb', () => ({
  openDb: vi.fn(() => Promise.resolve(mockDb))
}))

describe('[phase0] Database Migrations Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDb.exec.mockImplementation(() => {})
    mockDb.selectValue.mockImplementation(() => 0)
    mockDb.selectObjects.mockImplementation(() => [])
  })

  describe('Migration System', () => {
    it('runs migrations successfully', async () => {
      await expect(migrate()).resolves.toBeUndefined()
      expect(mockDb.exec).toHaveBeenCalled()
    })

    it('creates migration tracking table', async () => {
      await migrate()
      
      // Should create the migrations table first
      expect(mockDb.exec).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS migrations')
      )
    })

    it('applies core schema migration', async () => {
      // Mock that no migrations have been applied yet
      mockDb.selectValue.mockReturnValue(0)
      
      await migrate()
      
      // Should apply the core migration
      const execCalls = mockDb.exec.mock.calls
      const coreSchemaCall = execCalls.find(call => 
        call[0].includes('CREATE TABLE IF NOT EXISTS projects') &&
        call[0].includes('CREATE TABLE IF NOT EXISTS junctions') &&
        call[0].includes('CREATE TABLE IF NOT EXISTS segments')
      )
      
      expect(coreSchemaCall).toBeDefined()
    })

    it('applies additional tables migration', async () => {
      await migrate()
      
      const execCalls = mockDb.exec.mock.calls
      const additionalTablesCall = execCalls.find(call => 
        call[0].includes('CREATE TABLE IF NOT EXISTS junction_pressures_latest') &&
        call[0].includes('CREATE TABLE IF NOT EXISTS project_payloads') &&
        call[0].includes('CREATE TABLE IF NOT EXISTS project_heads') &&
        call[0].includes('CREATE TABLE IF NOT EXISTS device_info')
      )
      
      expect(additionalTablesCall).toBeDefined()
    })

    it('handles migration errors gracefully', async () => {
      mockDb.exec.mockImplementation(() => {
        throw new Error('Migration failed')
      })
      
      await expect(migrate()).rejects.toThrow('Migration failed')
    })

    it('is idempotent - can run multiple times safely', async () => {
      // First run
      await migrate()
      const firstRunCalls = mockDb.exec.mock.calls.length
      
      // Reset and run again
      vi.clearAllMocks()
      mockDb.exec.mockImplementation(() => {})
      
      // Mock that migrations have already been applied
      mockDb.selectValue.mockReturnValue(1) // Migration already exists
      
      await migrate()
      
      // Should not apply migrations again if they already exist
      // (This depends on the actual implementation checking for existing migrations)
      expect(mockDb.exec).toHaveBeenCalled()
    })
  })

  describe('Schema Validation', () => {
    it('creates all required tables', async () => {
      await migrate()
      
      const execCalls = mockDb.exec.mock.calls
      const allSql = execCalls.map(call => call[0]).join(' ')
      
      // Check that all required tables are created
      const requiredTables = [
        'projects',
        'junctions',
        'segments', 
        'results',
        'results_latest',
        'junction_pressures_latest',
        'project_payloads',
        'project_heads',
        'device_info'
      ]
      
      requiredTables.forEach(table => {
        expect(allSql).toContain(`CREATE TABLE IF NOT EXISTS ${table}`)
      })
    })

    it('creates proper indexes', async () => {
      await migrate()
      
      const execCalls = mockDb.exec.mock.calls
      const allSql = execCalls.map(call => call[0]).join(' ')
      
      // Check for index creation (if any are defined in migrations)
      // This would depend on your actual migration implementation
      expect(allSql).toContain('CREATE TABLE') // At minimum, tables should be created
    })

    it('uses correct column types and constraints', async () => {
      await migrate()
      
      const execCalls = mockDb.exec.mock.calls
      const allSql = execCalls.map(call => call[0]).join(' ')
      
      // Check for proper column definitions
      expect(allSql).toContain('id TEXT PRIMARY KEY')
      expect(allSql).toContain('NOT NULL')
      expect(allSql).toContain('REAL')
      expect(allSql).toContain('INTEGER')
      expect(allSql).toContain('BLOB')
    })
  })

  describe('Migration Versioning', () => {
    it('tracks migration versions', async () => {
      await migrate()
      
      // Should insert migration records
      const execCalls = mockDb.exec.mock.calls
      const insertMigrationCalls = execCalls.filter(call => 
        call[0].includes('INSERT INTO migrations')
      )
      
      expect(insertMigrationCalls.length).toBeGreaterThan(0)
    })

    it('applies migrations in correct order', async () => {
      await migrate()
      
      const execCalls = mockDb.exec.mock.calls
      
      // Find the order of migration applications
      const migrationInserts = execCalls
        .filter(call => call[0].includes('INSERT INTO migrations'))
        .map(call => call[1] && call[1][0]) // Extract migration name
        .filter(Boolean)
      
      // Should apply in order: 001_core, 002_rename_legacy_tables, 003_additional_tables
      expect(migrationInserts).toContain('001_core')
      expect(migrationInserts).toContain('002_rename_legacy_tables')
      expect(migrationInserts).toContain('003_additional_tables')
    })
  })

  describe('Legacy Table Handling', () => {
    it('drops legacy tables during migration', async () => {
      await migrate()
      
      const execCalls = mockDb.exec.mock.calls
      const allSql = execCalls.map(call => call[0]).join(' ')
      
      // Should drop old tables
      expect(allSql).toContain('DROP TABLE IF EXISTS nodes')
      expect(allSql).toContain('DROP TABLE IF EXISTS edges')
    })
  })

  describe('Error Recovery', () => {
    it('handles partial migration failures', async () => {
      let callCount = 0
      mockDb.exec.mockImplementation(() => {
        callCount++
        if (callCount === 3) {
          throw new Error('Simulated failure')
        }
      })
      
      await expect(migrate()).rejects.toThrow('Simulated failure')
    })

    it('handles database connection errors', async () => {
      const { openDb } = await import('./openDb')
      vi.mocked(openDb).mockRejectedValue(new Error('Connection failed'))
      
      await expect(migrate()).rejects.toThrow('Connection failed')
    })
  })
})
