import { createEffect, createSignal } from 'solid-js';
import { createCompartmentExtension } from './createCompartmentExtension';
import type { Accessor} from 'solid-js';
import type { Extension } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';

export type LazyCompartmentReconfigurationCallback = {
  loading: boolean;
} & ((extension: Extension) => void);

/**
 * Creates a lazy compartment extension for the given CodeMirror EditorView,
 * configured only after the Promise will be resolved.
 **
 * `fn` is **reactive**: any signal it reads (e.g. a language id) is tracked, so
 * the loader re-runs and the compartment reconfigures whenever that input
 * changes — not just once at mount.
 *
 * See {@link https://codemirror.net/examples/reconfigure/} for use cases and examples of `Compartments`.
 * Check out {@link https://codemirror.net/docs/ref/#state.Compartment} for more details about Compartment API.
 *
 * @param fn The Promise callback that will return the extension once resolved.
 * @param view The CodeMirror EditorView
 */
export function createLazyCompartmentExtension(
  fn: () => Promise<Extension | null | undefined>,
  view: Accessor<EditorView | undefined>
): LazyCompartmentReconfigurationCallback {
  const [loadedExtension, setLoadedExtension] = createSignal<Extension>([], {
    ownedWrite: true,
  });
  const [loading, setLoading] = createSignal(false, { ownedWrite: true });

  const reconfigure = createCompartmentExtension(() => loadedExtension(), view);

  const setExtension = (extension: Extension | null | undefined) => {
    const resolvedExtension = extension ?? [];
    reconfigure(resolvedExtension);
    setLoadedExtension(resolvedExtension);
  };

  // Re-run the loader whenever `fn`'s reactive dependencies change (e.g. the
  // code block's language id) and swap the compartment once each load resolves.
  // The compute calls `fn()` so its reactive reads are tracked, and wraps the
  // pending promise in a plain object so the runtime never mistakes the compute
  // for an async computation. A `stale` latch (cleared on the next run via the
  // returned cleanup) drops a slow earlier load that resolves after a newer
  // selection, so switching languages quickly always lands on the latest one.
  createEffect(
    () => ({ pending: fn() }),
    ({ pending }) => {
      let stale = false;
      setLoading(true);
      pending
        .then((extension) => {
          if (!stale) setExtension(extension);
        })
        .catch(() => {
          if (!stale) setExtension(null);
        })
        .finally(() => {
          if (!stale) setLoading(false);
        });
      return () => {
        stale = true;
      };
    }
  );

  return Object.defineProperties(reconfigure, {
    loading: {
      get: () => loading(),
    },
  }) as LazyCompartmentReconfigurationCallback;
}
