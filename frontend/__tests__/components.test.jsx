import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import StatusIndicator from '../src/components/StatusIndicator.jsx';
import TaskDetailCard from '../src/components/TaskDetailCard.jsx';
import ControlPanel from '../src/components/ControlPanel.jsx';
import EventTerminal from '../src/components/EventTerminal.jsx';

describe('StatusIndicator', () => {
  it('renders IDLE status correctly', () => {
    render(<StatusIndicator status="IDLE" connectionStatus="connected" />);
    expect(screen.getByText('Idle')).toBeTruthy();
    expect(screen.getByText('connected')).toBeTruthy();
  });

  it('renders ERROR status with pulse', () => {
    render(<StatusIndicator status="ERROR" connectionStatus="connected" />);
    expect(screen.getByText('Error')).toBeTruthy();
  });
});

describe('TaskDetailCard', () => {
  it('shows placeholder when no task', () => {
    render(<TaskDetailCard task={null} />);
    expect(screen.getByText('No active task')).toBeTruthy();
  });

  it('renders task details with progress', () => {
    const task = { id: 'abc-123', name: 'Test Task', progress: 42, duration: '5.2s' };
    render(<TaskDetailCard task={task} />);
    expect(screen.getByText('Test Task')).toBeTruthy();
    expect(screen.getByText('42%')).toBeTruthy();
  });
});

describe('ControlPanel', () => {
  it('renders all buttons when connected', () => {
    const handlers = { onStop: vi.fn(), onSync: vi.fn(), onTriggerMock: vi.fn() };
    render(<ControlPanel isConnected={true} {...handlers} />);
    expect(screen.getByText('Stop')).toBeTruthy();
    expect(screen.getByText('Sync')).toBeTruthy();
    expect(screen.getByText('Mock Hook')).toBeTruthy();
  });

  it('disables buttons when disconnected', () => {
    const handlers = { onStop: vi.fn(), onSync: vi.fn(), onTriggerMock: vi.fn() };
    render(<ControlPanel isConnected={false} {...handlers} />);
    expect(screen.getByText('Stop').closest('button')).toBeDisabled();
    expect(screen.getByText('Sync').closest('button')).toBeDisabled();
  });

  it('calls handlers on click', () => {
    const onStop = vi.fn();
    render(<ControlPanel isConnected={true} onStop={onStop} onSync={vi.fn()} onTriggerMock={vi.fn()} />);
    fireEvent.click(screen.getByText('Stop'));
    expect(onStop).toHaveBeenCalledOnce();
  });
});

describe('EventTerminal', () => {
  it('shows waiting message when no events', () => {
    render(<EventTerminal events={[]} />);
    expect(screen.getByText('Waiting for events...')).toBeTruthy();
  });

  it('renders events with severity colors', () => {
    const events = [
      {
        payload: {
          id: '1',
          event_name: 'task_completed',
          timestamp: Date.now() / 1000,
          severity: 'SUCCESS',
        },
      },
    ];
    render(<EventTerminal events={events} />);
    expect(screen.getByText('task_completed')).toBeTruthy();
  });
});
