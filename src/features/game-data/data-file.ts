import { useEffect, useState } from "react";

/** A static data file as the details showing it see it. */
export type DataFile<T> =
  | { readonly status: "loading" }
  | { readonly status: "failed"; readonly retry: () => void }
  | { readonly status: "ready"; readonly file: T };

/**
 * A hook for one kind of static data file, such as a module's or a reactor's levels
 * (ADR 0025, ADR 0026), loaded when its details open. Each file is asked for once per
 * visit; one that fails, or that `read` rejects, is asked for again on "Try again".
 */
export function dataFileHook<T>(
  read: (data: unknown) => T | null,
): (url: string) => DataFile<T> {
  const loaded = new Map<string, Promise<T | null>>();

  const load = (url: string): Promise<T | null> => {
    const known = loaded.get(url);
    if (known !== undefined) {
      return known;
    }
    const request = fetch(url)
      .then((response) => (response.ok ? response.json() : null))
      .then(read)
      .catch(() => null);
    loaded.set(url, request);
    void request.then((file) => {
      if (file === null) {
        loaded.delete(url);
      }
    });
    return request;
  };

  return function useDataFile(url: string): DataFile<T> {
    const [attempt, setAttempt] = useState(0);
    const key = `${url}#${String(attempt)}`;
    const [result, setResult] = useState<{
      readonly key: string;
      readonly file: T | null;
    } | null>(null);
    useEffect(() => {
      let current = true;
      void load(url).then((file) => {
        if (current) {
          setResult({ key, file });
        }
      });
      return () => {
        current = false;
      };
    }, [url, key]);
    if (result?.key !== key) {
      return { status: "loading" };
    }
    return result.file === null
      ? {
          status: "failed",
          retry: () => {
            setAttempt((value) => value + 1);
          },
        }
      : { status: "ready", file: result.file };
  };
}
