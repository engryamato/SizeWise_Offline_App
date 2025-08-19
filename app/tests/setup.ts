import '@testing-library/jest-dom'
import { vi, beforeEach } from 'vitest'

// Mock IndexedDB for vault tests
const mockIDBRequest = {
  result: null,
  error: null,
  onsuccess: null,
  onerror: null,
  readyState: 'done'
}

const mockIDBDatabase = {
  transaction: vi.fn(() => ({
    objectStore: vi.fn(() => ({
      get: vi.fn(() => mockIDBRequest),
      put: vi.fn(() => mockIDBRequest),
      delete: vi.fn(() => mockIDBRequest),
      getAll: vi.fn(() => mockIDBRequest),
      createIndex: vi.fn(),
      index: vi.fn(() => ({
        getAll: vi.fn(() => mockIDBRequest)
      }))
    }))
  })),
  createObjectStore: vi.fn(() => ({
    createIndex: vi.fn()
  })),
  objectStoreNames: {
    contains: vi.fn(() => false)
  }
}

const mockIDBOpenRequest = {
  ...mockIDBRequest,
  result: mockIDBDatabase,
  onupgradeneeded: null
}

// Mock IndexedDB
Object.defineProperty(window, 'indexedDB', {
  value: {
    open: vi.fn(() => mockIDBOpenRequest)
  },
  writable: true
})

// Mock crypto.subtle for vault tests
Object.defineProperty(window, 'crypto', {
  value: {
    subtle: {
      generateKey: vi.fn(() => Promise.resolve({})),
      encrypt: vi.fn(() => Promise.resolve(new ArrayBuffer(16))),
      decrypt: vi.fn(() => Promise.resolve(new ArrayBuffer(16)))
    },
    getRandomValues: vi.fn((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256)
      }
      return arr
    })
  },
  writable: true
})

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  },
  writable: true
})

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  },
  writable: true
})

// Mock location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    assign: vi.fn(),
    reload: vi.fn()
  },
  writable: true
})

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    serviceWorker: {
      register: vi.fn(() => Promise.resolve()),
      getRegistration: vi.fn(() => Promise.resolve(null))
    }
  },
  writable: true
})

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
})
