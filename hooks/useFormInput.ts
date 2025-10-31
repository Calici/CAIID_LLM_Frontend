import { SetStateAction, useCallback, useState } from "react";

export function useFormInput<T>(
  defaultValue: T,
): [T, (value: SetStateAction<T>) => void, string[], (value: SetStateAction<string[]>) => void] {
  const [value, setValue] = useState<T>(defaultValue);
  const [error, setError] = useState<string[]>([]);

  const setValueMemo = useCallback(
    (next: SetStateAction<T>) => {
      setValue(next);
    },
    [],
  );

  const setErrorMemo = useCallback(
    (next: SetStateAction<string[]>) => {
      setError(next);
    },
    [],
  );

  return [value, setValueMemo, error, setErrorMemo];
}
