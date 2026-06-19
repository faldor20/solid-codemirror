import { createEffect, untrack } from 'solid-js';
import { EditorView } from '@codemirror/view';
import { createCompartmentExtension } from '../core/createCompartmentExtension';
import type { Accessor} from 'solid-js';

function getReadOnlyExtensions(readOnly: boolean) {
  return readOnly ? EditorView.editable.of(false) : [];
}

/**
 * Allows to change the editor readOnly state by the given `readOnly` property value
 * @param view The editor view
 * @param readOnly The editor readOnly state
 */
export function createEditorReadonly(
  view: Accessor<EditorView | undefined>,
  readOnly: Accessor<boolean>
) {
  const localReadOnly = untrack(readOnly);

  const reconfigure = createCompartmentExtension(
    getReadOnlyExtensions(localReadOnly),
    view
  );

  createEffect(
    () => readOnly(),
    (readOnly) => reconfigure(getReadOnlyExtensions(readOnly))
  );
}
