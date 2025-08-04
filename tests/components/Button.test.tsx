import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { Button, buttonVariants, type ButtonProps } from '@/components/ui/button'

describe('Button component', () => {
  const variants: ButtonProps['variant'][] = [
    'default',
    'destructive',
    'outline',
    'secondary',
    'ghost',
    'link',
  ]

  variants.forEach((variant) => {
    it(`applies the ${variant} variant`, () => {
      const { getByRole } = render(<Button variant={variant}>Test</Button>)
      const button = getByRole('button')
      expect(button).toHaveClass(buttonVariants({ variant }))
    })
  })

  const sizes: ButtonProps['size'][] = ['default', 'sm', 'lg', 'icon']

  sizes.forEach((size) => {
    it(`applies the ${size} size`, () => {
      const label = size === 'icon' ? <span>i</span> : 'Test'
      const { getByRole } = render(<Button size={size}>{label}</Button>)
      const button = getByRole('button')
      expect(button).toHaveClass(buttonVariants({ size }))
    })
  })

  it('handles onClick and disabled state', () => {
    const handleClick = vi.fn()
    const { getByRole, rerender } = render(<Button onClick={handleClick}>Click</Button>)
    const button = getByRole('button')

    fireEvent.click(button)
    expect(handleClick).toHaveBeenCalledTimes(1)

    rerender(
      <Button disabled onClick={handleClick}>
        Click
      </Button>,
    )

    const disabledButton = getByRole('button')
    expect(disabledButton).toBeDisabled()
    fireEvent.click(disabledButton)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
