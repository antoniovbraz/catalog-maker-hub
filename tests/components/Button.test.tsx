import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button component', () => {
  it('matches snapshot', () => {
    const { container } = render(<Button variant="default">Click me</Button>);
    expect(container).toMatchSnapshot();
  });
});
