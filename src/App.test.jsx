import { describe, expect, it } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import App from './App.jsx'

describe('App', () => {
  it('renderiza el dashboard financiero inicial', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: /finance app/i })).toBeInTheDocument()
    expect(screen.getByText(/balance actual/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /registrar movimiento/i })).toBeInTheDocument()
    expect(screen.getByRole('table')).toBeInTheDocument()
  })
})
