import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const h = vi.hoisted(() => ({ recordView: vi.fn() }));
vi.mock('@/db/record-view', () => ({ recordView: h.recordView }));

import { RecordView } from '@/app/k/[token]/record-view';

beforeEach(() => h.recordView.mockReset());

describe('RecordView', () => {
  test('records exactly one view on mount and renders nothing', () => {
    const { container } = render(<RecordView token="tok-1" />);
    expect(h.recordView).toHaveBeenCalledExactlyOnceWith('tok-1');
    expect(container).toBeEmptyDOMElement();
  });

  test('does not double-record across re-renders', () => {
    const { rerender } = render(<RecordView token="tok-1" />);
    rerender(<RecordView token="tok-1" />);
    expect(h.recordView).toHaveBeenCalledTimes(1);
  });
});
