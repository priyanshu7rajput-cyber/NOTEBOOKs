'use client';

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { HandwritingData, HandwritingStroke, StrokePoint } from '@/types/database';

interface CanvasHandwritingProps {
  initialData?: HandwritingData;
  onChange?: (data: HandwritingData) => void;
  penColor?: string;
  penSize?: number;
  isEraser?: boolean;
  isReadOnly?: boolean;
}

export interface CanvasHandwritingRef {
  undo: () => void;
  redo: () => void;
  clear: () => void;
  getData: () => HandwritingData;
}

export const CanvasHandwriting = forwardRef<CanvasHandwritingRef, CanvasHandwritingProps>(
  (
    {
      initialData,
      onChange,
      penColor = '#1e293b',
      penSize = 3,
      isEraser = false,
      isReadOnly = false,
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [strokes, setStrokes] = useState<HandwritingStroke[]>(
      initialData?.strokes || []
    );
    const [redoStack, setRedoStack] = useState<HandwritingStroke[]>([]);
    const isDrawingRef = useRef(false);
    const currentStrokeRef = useRef<HandwritingStroke | null>(null);

    // Expose methods for toolbar
    useImperativeHandle(ref, () => ({
      undo: () => {
        if (strokes.length === 0) return;
        const last = strokes[strokes.length - 1];
        const updated = strokes.slice(0, -1);
        setStrokes(updated);
        setRedoStack((prev) => [...prev, last]);
        if (onChange) onChange({ version: 1, strokes: updated });
      },
      redo: () => {
        if (redoStack.length === 0) return;
        const next = redoStack[redoStack.length - 1];
        const updatedRedo = redoStack.slice(0, -1);
        const updated = [...strokes, next];
        setRedoStack(updatedRedo);
        setStrokes(updated);
        if (onChange) onChange({ version: 1, strokes: updated });
      },
      clear: () => {
        setStrokes([]);
        setRedoStack([]);
        if (onChange) onChange({ version: 1, strokes: [] });
      },
      getData: () => ({
        version: 1,
        strokes,
      }),
    }));

    // Re-draw canvas whenever strokes change or canvas resizes
    const redrawCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      strokes.forEach((stroke) => {
        if (stroke.points.length < 1) return;

        ctx.save();
        ctx.beginPath();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (stroke.isEraser) {
          ctx.globalCompositeOperation = 'destination-out';
          ctx.lineWidth = stroke.width * 4;
        } else {
          ctx.globalCompositeOperation = 'source-over';
          ctx.strokeStyle = stroke.color;
          ctx.lineWidth = stroke.width;
        }

        const pts = stroke.points;
        if (pts.length === 1) {
          ctx.arc(pts[0].x, pts[0].y, stroke.width / 2, 0, Math.PI * 2);
          ctx.fillStyle = stroke.color;
          ctx.fill();
        } else {
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length - 1; i++) {
            const xc = (pts[i].x + pts[i + 1].x) / 2;
            const yc = (pts[i].y + pts[i + 1].y) / 2;
            ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
          }
          ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
          ctx.stroke();
        }

        ctx.restore();
      });
    };

    useEffect(() => {
      redrawCanvas();
    }, [strokes]);

    // Handle high DPI display
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const resize = () => {
        const rect = canvas.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        canvas.width = rect.width;
        canvas.height = rect.height;
        redrawCanvas();
      };

      resize();
      window.addEventListener('resize', resize);
      return () => window.removeEventListener('resize', resize);
    }, []);

    // Pointer Events API (Mouse, Touch, Stylus support)
    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (isReadOnly) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.setPointerCapture(e.pointerId);
      isDrawingRef.current = true;

      const rect = canvas.getBoundingClientRect();
      const point: StrokePoint = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        pressure: e.pressure > 0 ? e.pressure : 0.5,
      };

      const newStroke: HandwritingStroke = {
        id: Math.random().toString(36).substring(2, 9),
        points: [point],
        color: penColor,
        width: penSize,
        isEraser: isEraser,
      };

      currentStrokeRef.current = newStroke;
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current || !currentStrokeRef.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const point: StrokePoint = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        pressure: e.pressure > 0 ? e.pressure : 0.5,
      };

      currentStrokeRef.current.points.push(point);

      // Draw immediate stroke incrementally
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.save();
        ctx.beginPath();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (currentStrokeRef.current.isEraser) {
          ctx.globalCompositeOperation = 'destination-out';
          ctx.lineWidth = currentStrokeRef.current.width * 4;
        } else {
          ctx.globalCompositeOperation = 'source-over';
          ctx.strokeStyle = currentStrokeRef.current.color;
          ctx.lineWidth = currentStrokeRef.current.width;
        }

        const pts = currentStrokeRef.current.points;
        if (pts.length > 2) {
          const lastIdx = pts.length - 1;
          const xc = (pts[lastIdx - 1].x + pts[lastIdx].x) / 2;
          const yc = (pts[lastIdx - 1].y + pts[lastIdx].y) / 2;
          ctx.moveTo(pts[lastIdx - 1].x, pts[lastIdx - 1].y);
          ctx.lineTo(xc, yc);
          ctx.stroke();
        }
        ctx.restore();
      }
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current || !currentStrokeRef.current) return;
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.releasePointerCapture(e.pointerId);
      }

      isDrawingRef.current = false;
      const completedStroke = currentStrokeRef.current;
      currentStrokeRef.current = null;

      const updatedStrokes = [...strokes, completedStroke];
      setStrokes(updatedStrokes);
      setRedoStack([]); // reset redo on new action

      if (onChange) {
        onChange({
          version: 1,
          strokes: updatedStrokes,
        });
      }
    };

    return (
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="absolute inset-0 w-full h-full touch-none z-10 cursor-crosshair pointer-events-auto"
        style={{ touchAction: 'none' }}
      />
    );
  }
);

CanvasHandwriting.displayName = 'CanvasHandwriting';
