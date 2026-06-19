import { createEffect, createMemo } from 'solid-js';
import type { Accessor} from 'solid-js';
import type { EditorView } from '@codemirror/view';

/**
 * Makes the view state value controlled.
 * @param view The editor view.
 * @param code The editor code. Whenever this value change, the editor view state will be updated automatically
 */
export function createEditorControlledValue(
  view: Accessor<EditorView | undefined>,
  code: Accessor<string | undefined | null>
): void {
  const memoizedCode = createMemo(code);

  // Single effect tracking both the view and the controlled code. (Solid 2.0: the
  // apply callback runs in an unowned scope, so nesting a `createEffect` inside it
  // leaks — NO_OWNER_EFFECT — and never disposes. Track both deps in the compute
  // phase instead.)
  createEffect(
    () => [view(), memoizedCode()] as const,
    ([view, code]) => {
      if (!view) return;
      const localValue = view.state.doc.toString();
      if (localValue === code) return;
      view.dispatch({
        changes: {
          from: 0,
          to: localValue.length,
          insert: code ?? '',
        },
      });
    }
  );
}
