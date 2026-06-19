import { Compartment, StateEffect } from '@codemirror/state';
import { createEffect } from 'solid-js';
import type { Extension} from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import type { Accessor} from 'solid-js';

export type CompartmentReconfigurationCallback = (extension: Extension) => void;

/**
 * Creates a compartment extension for the given CodeMirror EditorView.
 *
 * Extension compartments can be used to make a configuration dynamic.
 * By wrapping part of your configuration in a compartment, you can later replace that part through a transaction.
 *
 * See {@link https://codemirror.net/examples/reconfigure/} for use cases and examples of `Compartments`.
 * Check out {@link https://codemirror.net/docs/ref/#state.Compartment} for more details about Compartment API.
 *
 * @param extension The extension to wrap in a compartment.
 * @param view The CodeMirror EditorView
 */
export function createCompartmentExtension(
  extension: Accessor<Extension | undefined> | Extension,
  view: Accessor<EditorView | undefined>
): CompartmentReconfigurationCallback {
  const compartment = new Compartment();

  const reconfigure = (extension: Extension) => {
    view()?.dispatch({
      effects: compartment.reconfigure(extension),
    });
  };

  const $extension =
    typeof extension === 'function' ? extension : () => extension;

  createEffect(
    () => [view(), $extension()] as const,
    ([view, extension]) => {
      if (view && extension) {
        // Use the `view` resolved in the compute phase — calling `reconfigure`
        // here would re-read the reactive `view()` accessor inside this untracked
        // apply callback (Solid 2.0 STRICT_READ_UNTRACKED).
        if (compartment.get(view.state)) {
          view.dispatch({ effects: compartment.reconfigure(extension) });
        } else {
          view.dispatch({
            effects: StateEffect.appendConfig.of(compartment.of(extension)),
          });
        }
      }
    },
    { defer: true }
  );

  return reconfigure;
}
