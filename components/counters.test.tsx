import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import MyApp from './counters';

afterEach(() => {
  cleanup();
});

describe('MyApp counter', () => {
  it('starts at zero clicks', () => {
    render(<MyApp />);
    expect(screen.getByRole('button')).toHaveTextContent('Clicked 0 times');
  });

  it('increments on click', () => {
    render(<MyApp />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(button).toHaveTextContent('Clicked 1 times');
    fireEvent.click(button);
    expect(button).toHaveTextContent('Clicked 2 times');
  });
});
