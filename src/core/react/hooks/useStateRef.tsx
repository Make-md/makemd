import { Dispatch, SetStateAction, useCallback, useRef, useState } from "react";

const isFunction = <S,>(
  setStateAction: SetStateAction<S>
): setStateAction is (prevState: S) => S =>
  typeof setStateAction === "function";

type ReadOnlyRefObject<T> = {
  readonly current: T;
};

type UseStateRef = {
  <S>(initialState: S | (() => S)): [
    S,
    Dispatch<SetStateAction<S>>,
    ReadOnlyRefObject<S>
  ];
  <S = undefined>(): [
    S | undefined,
    Dispatch<SetStateAction<S | undefined>>,
    ReadOnlyRefObject<S | undefined>
  ];
};

export const useStateRef: UseStateRef = <S,>(initialState?: S | (() => S)) => {
  const [state, setState] = useState(initialState);
  const ref = useRef(state);

  const dispatch: typeof setState = useCallback((setStateAction: any) => {
    ref.current = isFunction(setStateAction)
      ? setStateAction(ref.current)
      : setStateAction;

    setState(ref.current);
  }, []);

  return [state, dispatch, ref];
};
