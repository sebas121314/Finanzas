import '@testing-library/jest-dom'
import { TextDecoder, TextEncoder } from 'node:util'

globalThis.TextDecoder = TextDecoder
globalThis.TextEncoder = TextEncoder

if (!globalThis.Headers) {
  globalThis.Headers = class Headers {
    constructor(init = {}) {
      this.map = new Map(Object.entries(init))
    }

    get(name) {
      return this.map.get(name)
    }

    set(name, value) {
      this.map.set(name, value)
    }
  }
}

if (!globalThis.Request) {
  globalThis.Request = class Request {
    constructor(input, init = {}) {
      this.body = init.body ?? null
      this.headers = new Headers(init.headers)
      this.method = init.method ?? 'GET'
      this.signal = init.signal ?? null
      this.url = input.toString()
    }

    clone() {
      return new Request(this.url, this)
    }
  }
}
