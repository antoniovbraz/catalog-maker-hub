import { test, expect } from 'vitest';
import { render } from '@testing-library/react';
import { DataVisualization } from '@/components/ui/data-visualization';

test('description cells break long strings', () => {
  const longDescription = 'L'.repeat(200);
  const data = [{ id: '1', description: longDescription }];
  const columns = [
    { key: 'description', header: 'Descrição', className: 'break-words' }
  ];

  const { getByText } = render(
    <DataVisualization title="" data={data} columns={columns} />
  );

  const cell = getByText(longDescription).closest('td');
  expect(cell).toHaveClass('break-words');
});
