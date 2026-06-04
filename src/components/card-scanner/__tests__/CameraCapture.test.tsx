import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import CameraCapture from '../CameraCapture';
import { reportError, reportMessage } from '@/utils/sentry';
import { toast } from '@/lib/toast';

// Mock the Sentry wrappers so we can assert on what gets reported.
vi.mock('@/utils/sentry', () => ({
  reportError: vi.fn(),
  reportMessage: vi.fn(),
}));

// Capacitor: treat as a web (non-native) platform.
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => false },
}));

// zxing: never finds a QR code in tests.
vi.mock('@zxing/library', () => ({
  BrowserMultiFormatReader: class {
    decodeOnce = vi.fn().mockRejectedValue(new Error('no qr'));
  },
}));

// toast: spy on user-facing notifications.
vi.mock('@/lib/toast', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

function makeStream() {
  return { getTracks: () => [{ stop: vi.fn() }] } as unknown as MediaStream;
}

/** Override the read-only videoWidth/videoHeight getters on the rendered <video>. */
function setVideoDimensions(width: number, height: number) {
  const video = document.querySelector('video');
  if (!video) throw new Error('no <video> rendered');
  Object.defineProperty(video, 'videoWidth', { configurable: true, value: width });
  Object.defineProperty(video, 'videoHeight', { configurable: true, value: height });
  return video;
}

describe('CameraCapture', () => {
  let getUserMedia: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    getUserMedia = vi.fn().mockResolvedValue(makeStream());
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    });

    // jsdom doesn't implement media playback; make play() a resolved no-op.
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);

    // jsdom canvas has no 2d context by default; provide a fake one.
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      drawImage: vi.fn(),
    }) as unknown as typeof HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.toDataURL = vi
      .fn()
      .mockReturnValue('data:image/png;base64,FAKE');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('captures and calls onCapture when the video has a frame', async () => {
    const onCapture = vi.fn();
    render(<CameraCapture onCapture={onCapture} onCancel={vi.fn()} hideBackButton />);

    await waitFor(() => expect(getUserMedia).toHaveBeenCalled());

    // Simulate a playing stream with real dimensions.
    setVideoDimensions(1920, 1080);

    fireEvent.click(screen.getByRole('button'));

    expect(onCapture).toHaveBeenCalledTimes(1);
    expect(onCapture).toHaveBeenCalledWith('data:image/png;base64,FAKE');
    expect(reportMessage).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('does NOT capture and reports when the video has no frame (the Android bug)', async () => {
    const onCapture = vi.fn();
    render(<CameraCapture onCapture={onCapture} onCancel={vi.fn()} hideBackButton />);

    await waitFor(() => expect(getUserMedia).toHaveBeenCalled());

    // Stream resolved but the video never produced a frame: 0x0.
    setVideoDimensions(0, 0);

    fireEvent.click(screen.getByRole('button'));

    expect(onCapture).not.toHaveBeenCalled();
    expect(reportMessage).toHaveBeenCalledTimes(1);
    expect(reportMessage).toHaveBeenCalledWith(
      'Camera capture attempted with no video frame',
      expect.objectContaining({ tags: { feature: 'camera_capture' } }),
    );
    expect(toast.error).toHaveBeenCalled();
  });

  it('shows a permission-specific error and reports when access is blocked', async () => {
    const notAllowed = Object.assign(new Error('denied'), { name: 'NotAllowedError' });
    getUserMedia.mockRejectedValueOnce(notAllowed);

    render(<CameraCapture onCapture={vi.fn()} onCancel={vi.fn()} hideBackButton />);

    expect(await screen.findByText(/camera access was blocked/i)).toBeInTheDocument();
    expect(reportError).toHaveBeenCalledTimes(1);
    expect(reportError).toHaveBeenCalledWith(
      notAllowed,
      expect.objectContaining({
        tags: expect.objectContaining({ feature: 'camera_init', error_name: 'NotAllowedError' }),
      }),
    );
  });

  it('shows a hardware error and reports when the device cannot start the camera', async () => {
    const notReadable = Object.assign(new Error('in use'), { name: 'NotReadableError' });
    getUserMedia.mockRejectedValueOnce(notReadable);

    render(<CameraCapture onCapture={vi.fn()} onCancel={vi.fn()} hideBackButton />);

    expect(await screen.findByText(/could not start your camera/i)).toBeInTheDocument();
    expect(reportError).toHaveBeenCalledWith(
      notReadable,
      expect.objectContaining({
        tags: expect.objectContaining({ feature: 'camera_init', error_name: 'NotReadableError' }),
      }),
    );
  });
});
