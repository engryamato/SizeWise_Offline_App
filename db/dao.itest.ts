import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  initDb,
  createProject,
  listProjects,
  createJunction,
  listJunctions,
  createSegment,
  listSegments,
  countProjects,
  countSegments,
  canCreateProject,
  canCreateSegment,
  FreeTierLimitError
} from './dao'
import { ulid } from '../lib/ids'

// Mock the SQLite database for integration tests
// In a real integration test, you'd use a test database
const mockDb = {
  exec: vi.fn(),
  selectValue: vi.fn(),
  selectObjects: vi.fn(() => [])
}

vi.mock('./openDb', () => ({
  openDb: vi.fn(() => Promise.resolve(mockDb))
}))

vi.mock('./migrations', () => ({
  migrate: vi.fn(() => Promise.resolve())
}))

// Mock the vault system to avoid timeouts
vi.mock('../lib/vault', () => ({
  DeviceVault: {
    createSnapshot: vi.fn(() => Promise.resolve('mock-snapshot-id'))
  }
}))

describe('[phase0] DAO Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock implementations
    mockDb.exec.mockImplementation(() => {})
    mockDb.selectValue.mockImplementation(() => 0)
    mockDb.selectObjects.mockImplementation(() => [])
  })

  describe('Database Initialization', () => {
    it('initializes database successfully', async () => {
      await expect(initDb()).resolves.toBeUndefined()
    })
  })

  describe('Project Management', () => {
    it('creates project successfully', async () => {
      const projectId = await createProject('Test Project', 'imperial', 'residential', 'Test description')
      
      expect(typeof projectId).toBe('string')
      expect(projectId.length).toBeGreaterThan(0)
      expect(mockDb.exec).toHaveBeenCalledTimes(2) // projects + project_heads tables
    })

    it('lists projects', async () => {
      const mockProjects = [
        { id: '1', name: 'Project 1', updated_at: Date.now() },
        { id: '2', name: 'Project 2', updated_at: Date.now() }
      ]

      // Mock the exec function to call the callback with mock data
      mockDb.exec.mockImplementation(({ callback }) => {
        if (callback) {
          mockProjects.forEach(callback)
        }
      })

      const projects = await listProjects()
      expect(projects).toEqual(mockProjects)
    })

    it('counts projects correctly', async () => {
      mockDb.selectValue.mockReturnValue(5)
      
      const count = await countProjects()
      expect(count).toBe(5)
    })
  })

  describe('Free Tier Enforcement', () => {
    it('enforces maximum project limit', async () => {
      // Mock that we already have 2 projects (the limit)
      mockDb.selectValue.mockReturnValue(2)
      
      await expect(createProject('Third Project', 'imperial'))
        .rejects.toThrow(FreeTierLimitError)
      
      await expect(createProject('Third Project', 'imperial'))
        .rejects.toThrow(/maximum.*projects/i)
    })

    it('allows project creation under limit', async () => {
      // Mock that we have 1 project (under the limit of 2)
      mockDb.selectValue.mockReturnValue(1)
      
      await expect(createProject('Second Project', 'imperial'))
        .resolves.toBeDefined()
    })

    it('enforces maximum segments per project limit', async () => {
      // Mock that project already has 150 segments (the limit)
      mockDb.selectValue.mockReturnValue(150)

      const projectId = ulid()
      const junction1Id = ulid()
      const junction2Id = ulid()

      await expect(createSegment(projectId, 'round', junction1Id, junction2Id, 0.1, 0.3, 10))
        .rejects.toThrow(FreeTierLimitError)

      await expect(createSegment(projectId, 'round', junction1Id, junction2Id, 0.1, 0.3, 10))
        .rejects.toThrow(/segments per project/i)
    })

    it('allows segment creation under limit', async () => {
      // Mock that project has 149 segments (under the limit of 150)
      mockDb.selectValue.mockReturnValue(149)

      const projectId = ulid()
      const junction1Id = ulid()
      const junction2Id = ulid()

      await expect(createSegment(projectId, 'round', junction1Id, junction2Id, 0.1, 0.3, 10))
        .resolves.toBeDefined()
    })
  })

  describe('Validation Helpers', () => {
    it('canCreateProject returns correct status when under limit', async () => {
      mockDb.selectValue.mockReturnValue(1) // 1 project, limit is 2
      
      const result = await canCreateProject()
      expect(result.allowed).toBe(true)
      expect(result.current).toBe(1)
      expect(result.limit).toBe(2)
      expect(result.reason).toBeUndefined()
    })

    it('canCreateProject returns correct status when at limit', async () => {
      mockDb.selectValue.mockReturnValue(2) // 2 projects, limit is 2
      
      const result = await canCreateProject()
      expect(result.allowed).toBe(false)
      expect(result.current).toBe(2)
      expect(result.limit).toBe(2)
      expect(result.reason).toContain('Maximum 2 projects')
    })

    it('canCreateSegment returns correct status when under limit', async () => {
      mockDb.selectValue.mockReturnValue(100) // 100 segments, limit is 150
      
      const result = await canCreateSegment('project-id')
      expect(result.allowed).toBe(true)
      expect(result.current).toBe(100)
      expect(result.limit).toBe(150)
      expect(result.reason).toBeUndefined()
    })

    it('canCreateSegment returns correct status when at limit', async () => {
      mockDb.selectValue.mockReturnValue(150) // 150 segments, limit is 150
      
      const result = await canCreateSegment('project-id')
      expect(result.allowed).toBe(false)
      expect(result.current).toBe(150)
      expect(result.limit).toBe(150)
      expect(result.reason).toContain('Maximum 150 segments')
    })
  })

  describe('Junction Management', () => {
    it('creates junction successfully', async () => {
      const projectId = ulid()
      const junctionId = await createJunction(projectId, 'supply', 10, 20, 0, { test: 'meta' })

      expect(typeof junctionId).toBe('string')
      expect(junctionId.length).toBeGreaterThan(0)
      expect(mockDb.exec).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO junctions'),
        expect.arrayContaining([projectId, 'supply', 10, 20, 0, '{"test":"meta"}'])
      )
    })

    it('lists junctions for project', async () => {
      const mockJunctions = [
        { id: '1', kind: 'supply', x: 10, y: 20, z: 0 },
        { id: '2', kind: 'return', x: 30, y: 40, z: 0 }
      ]
      mockDb.exec.mockImplementation(({ callback }) => {
        mockJunctions.forEach(callback)
      })

      const junctions = await listJunctions('project-id')
      expect(junctions).toEqual(mockJunctions)
    })
  })

  describe('Segment Management', () => {
    it('creates segment successfully', async () => {
      // Mock segment count under limit
      mockDb.selectValue.mockReturnValue(50)

      const projectId = ulid()
      const junction1Id = ulid()
      const junction2Id = ulid()

      const segmentId = await createSegment(
        projectId,
        'round',
        junction1Id,
        junction2Id,
        0.1, // A
        0.3, // Dh
        10,  // L
        0.0015, // k
        0,   // K
        { diameter: 0.3 }, // geom
        { material: 'galvanized' } // meta
      )
      
      expect(typeof segmentId).toBe('string')
      expect(segmentId.length).toBeGreaterThan(0)
      expect(mockDb.exec).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO segments'),
        expect.arrayContaining([
          expect.any(String), // id
          projectId,
          'round',
          junction1Id,
          junction2Id,
          0.1, 0.3, 10, 0.0015, 0,
          '{"diameter":0.3}',
          '{"material":"galvanized"}'
        ])
      )
    })

    it('lists segments for project', async () => {
      const mockSegments = [
        { id: '1', kind: 'round', junction_from: 'j1', junction_to: 'j2', A: 0.1, Dh: 0.3, L: 10 },
        { id: '2', kind: 'rect', junction_from: 'j2', junction_to: 'j3', A: 0.2, Dh: 0.4, L: 15 }
      ]
      mockDb.exec.mockImplementation(({ callback }) => {
        mockSegments.forEach(callback)
      })

      const segments = await listSegments('project-id')
      expect(segments).toEqual(mockSegments)
    })

    it('counts segments for project', async () => {
      mockDb.selectValue.mockReturnValue(25)
      
      const count = await countSegments('project-id')
      expect(count).toBe(25)
    })
  })

  describe('Error Handling', () => {
    it('handles database errors gracefully', async () => {
      mockDb.exec.mockImplementation(() => {
        throw new Error('Database error')
      })
      
      await expect(createProject('Test', 'imperial')).rejects.toThrow('Database error')
    })

    it('handles missing data gracefully', async () => {
      mockDb.selectValue.mockReturnValue(null)
      
      const count = await countProjects()
      expect(count).toBe(0) // Should default to 0
    })
  })

  describe('FreeTierLimitError', () => {
    it('creates error with correct properties', () => {
      const error = new FreeTierLimitError('TEST_CODE', 'Test message', 5, 10)
      
      expect(error.code).toBe('TEST_CODE')
      expect(error.message).toBe('Test message')
      expect(error.limit).toBe(5)
      expect(error.current).toBe(10)
      expect(error.name).toBe('FreeTierLimitError')
      expect(error).toBeInstanceOf(Error)
    })
  })
})
