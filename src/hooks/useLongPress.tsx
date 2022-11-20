import React, { useEffect, useState, useCallback } from 'react';


export function isMouseEvent(e: React.TouchEvent | React.MouseEvent): e is React.MouseEvent {
    return e && 'screenX' in e;
}