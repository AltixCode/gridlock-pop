import React from 'react';
import { View } from 'react-native';
import { BlockCell } from './BlockCell';
import type { Piece } from '../game';

interface PieceShapeProps {
  piece: Piece;
  cellSize: number;
  dimmed?: boolean;
}

/** Renders a piece footprint at an arbitrary cell size — used in the tray and the drag layer. */
export function PieceShape({ piece, cellSize, dimmed = false }: PieceShapeProps) {
  return (
    <View accessible={false}>
      {piece.shape.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row' }}>
          {row.map((filled, c) => (
            <View key={c} style={{ width: cellSize, height: cellSize }}>
              {filled ? (
                <BlockCell size={cellSize} colorId={piece.colorId} dimmed={dimmed} />
              ) : null}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

export function shapeWidth(piece: Piece): number {
  return piece.shape[0]?.length ?? 0;
}

export function shapeHeight(piece: Piece): number {
  return piece.shape.length;
}
