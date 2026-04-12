import { useCallback, useRef, useState } from 'react';
import { Box, Button } from '@mui/material';

interface SignatureCanvasProps {
  onSignatureChange: (base64: string | null) => void;
  width?: number;
  height?: number;
}

const getCoordinates = (
  canvas: HTMLCanvasElement,
  event: React.MouseEvent | React.TouchEvent,
): { x: number; y: number } | null => {
  const rect = canvas.getBoundingClientRect();
  if ('touches' in event) {
    const touch = event.touches[0];
    if (!touch) {
      return null;
    }
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  }
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
};

const configureContext = (ctx: CanvasRenderingContext2D): void => {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#000';
};

export const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
  onSignatureChange,
  width = 600,
  height = 200,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }
      const coords = getCoordinates(canvas, event);
      if (!coords) {
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }
      configureContext(ctx);
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
      setIsDrawing(true);
    },
    [],
  );

  const draw = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing) {
        return;
      }
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }
      const coords = getCoordinates(canvas, event);
      if (!coords) {
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    },
    [isDrawing],
  );

  const stopDrawing = useCallback(() => {
    if (!isDrawing) {
      return;
    }
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const base64 = canvas.toDataURL('image/png');
    onSignatureChange(base64);
  }, [isDrawing, onSignatureChange]);

  const handleTouchMove = useCallback(
    (event: React.TouchEvent) => {
      event.preventDefault();
      draw(event);
    },
    [draw],
  );

  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    ctx.clearRect(0, 0, width, height);
    onSignatureChange(null);
  }, [width, height, onSignatureChange]);

  return (
    <Box>
      <Box
        sx={{
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          width: '100%',
          overflow: 'hidden',
        }}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{ cursor: 'crosshair', touchAction: 'none', display: 'block', maxWidth: '100%' }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={handleTouchMove}
          onTouchEnd={stopDrawing}
        />
      </Box>
      <Button variant="text" size="small" onClick={handleClear}>
        Clear
      </Button>
    </Box>
  );
};
