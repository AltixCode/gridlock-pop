import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { ErrorBoundary } from '../ErrorBoundary';

function Boom({ shouldThrow }: { shouldThrow: boolean }): React.ReactElement {
  if (shouldThrow) throw new Error('grid exploded');
  return <Text>Playing</Text>;
}

describe('ErrorBoundary', () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    // React logs the caught error itself; silence it so the suite output stays readable.
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => consoleError.mockRestore());

  it('renders its children when nothing goes wrong', async () => {
    const view = await render(
      <ErrorBoundary>
        <Boom shouldThrow={false} />
      </ErrorBoundary>,
    );
    expect(view.getByText('Playing')).toBeTruthy();
  });

  it('shows a recovery screen instead of a blank app when a child throws', async () => {
    const view = await render(
      <ErrorBoundary>
        <Boom shouldThrow />
      </ErrorBoundary>,
    );

    expect(view.getByText('Something went wrong')).toBeTruthy();
    expect(view.getByLabelText('Start a new game')).toBeTruthy();
  });

  it('reports the failure to the handler it was given', async () => {
    const onError = jest.fn();
    await render(
      <ErrorBoundary onError={onError}>
        <Boom shouldThrow />
      </ErrorBoundary>,
    );

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
  });

  it('recovers when the player restarts', async () => {
    // Mirrors the real app: onReset is what makes the children stop throwing. Clearing the
    // boundary's own state alone would just re-render the same broken tree.
    let broken = true;
    const onReset = jest.fn(() => {
      broken = false;
    });

    function Flaky(): React.ReactElement {
      if (broken) throw new Error('grid exploded');
      return <Text>Playing</Text>;
    }

    const view = await render(
      <ErrorBoundary onReset={onReset}>
        <Flaky />
      </ErrorBoundary>,
    );
    expect(view.getByText('Something went wrong')).toBeTruthy();

    await fireEvent.press(view.getByLabelText('Start a new game'));

    expect(onReset).toHaveBeenCalledTimes(1);
    expect(view.getByText('Playing')).toBeTruthy();
  });
});
