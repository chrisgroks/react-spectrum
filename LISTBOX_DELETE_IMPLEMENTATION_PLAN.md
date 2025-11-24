# ListBox Delete/Backspace Feature Implementation Plan

## Issue Reference
GitHub Issue: https://github.com/adobe/react-spectrum/issues/8732
**Description:** Add keyboard deletion support (Backspace/Delete) to ListBox component for removing selected items

## Problem Statement
Currently, the ListBox component does not support item deletion via keyboard events (Backspace/Delete). Users expect to be able to:
- Select items in a ListBox
- Press Backspace or Delete to remove selected items
- Have proper focus management after deletion (similar to Apple Mail inbox)

The issue notes that neither ListBox nor ListBoxItem currently allow custom keyboard event handling for deletion, requiring users to implement global listeners and manual selection logic.

## Architecture Analysis

### Current Structure
Based on the codebase analysis:

1. **React Aria Components Layer** (`packages/react-aria-components/src/ListBox.tsx`)
   - `ListBox` component - main wrapper
   - `ListBoxItem` component - individual items
   - Already supports `onAction` for item activation

2. **React Aria Hooks Layer** (`packages/@react-aria/listbox/`)
   - `useListBox` - provides behavior and accessibility
   - `useOption` - handles individual item behavior
   - Uses `useSelectableList` which wraps `useSelectableCollection`

3. **Selection Layer** (`packages/@react-aria/selection/`)
   - `useSelectableCollection` - handles keyboard navigation
   - `useSelectableItem` - handles item interactions

### Similar Implementation: TagGroup
The TagGroup component (`packages/@react-aria/tag/`) already implements delete functionality:
- Handles `Delete` and `Backspace` keys in `useTag.ts` (lines 64-76)
- Supports deleting selected items vs single focused item
- Uses `onRemove` callback that receives a Set of keys to remove
- Pattern: `onRemove?.(new Set(state.selectionManager.selectedKeys))`

## Proposed Solution

### 1. Add `onRemove` Prop to ListBox
Following the TagGroup pattern, add an optional `onRemove` callback:

**API Design:**
```typescript
interface ListBoxProps<T> {
  // ... existing props
  /** 
   * Handler that is called when the user deletes items via keyboard.
   * Receives a Set of keys representing the items to be removed.
   */
  onRemove?: (keys: Set<Key>) => void
}
```

### 2. Implementation Layers

#### Layer 1: Type Definitions (`packages/@react-types/listbox/src/index.d.ts`)
- Add `onRemove?: (keys: Set<Key>) => void` to `AriaListBoxProps<T>`
- Update TypeScript interfaces

#### Layer 2: React Aria Hook (`packages/@react-aria/listbox/src/useListBox.ts`)
- Pass `onRemove` through `listData.set(state, {...})` (similar to line 102)
- Store callback for child components to access

#### Layer 3: Selection Hook (`packages/@react-aria/selection/src/useSelectableCollection.ts`)
- Add keyboard handler for `Delete` and `Backspace` keys in the `onKeyDown` switch statement (around line 172)
- Logic:
  ```typescript
  case 'Delete':
  case 'Backspace': {
    if (onRemove && manager.selectedKeys.size > 0) {
      e.preventDefault();
      let keysToRemove = new Set(manager.selectedKeys);
      
      // Calculate next focus key before removal
      let nextKey = getNextFocusKey(keysToRemove, manager, delegate);
      
      // Call onRemove callback
      onRemove(keysToRemove);
      
      // Update focus after removal
      if (nextKey) {
        manager.setFocusedKey(nextKey);
      }
    }
    break;
  }
  ```

#### Layer 4: React Aria Components (`packages/react-aria-components/src/ListBox.tsx`)
- Update `ListBoxProps<T>` interface to include `onRemove`
- Pass through to underlying hooks

#### Layer 5: Spectrum v2/v3 Components (if needed)
- Update `packages/@react-spectrum/s2/src/ListBox.tsx`
- Update `starters/docs/src/ListBox.tsx` and `starters/tailwind/src/ListBox.tsx`

### 3. Focus Management Strategy

After item deletion, focus should move intelligently:

**Priority order:**
1. Next item after the last deleted item
2. Previous item before the first deleted item  
3. If list is empty, focus the ListBox container itself
4. Handle edge cases (all items deleted, first/last items)

**Helper function:**
```typescript
function getNextFocusKey(
  keysToRemove: Set<Key>, 
  manager: SelectionManager,
  delegate: KeyboardDelegate
): Key | null {
  // Find the last selected key in visual order
  let lastKey = getLastKey(keysToRemove, delegate);
  
  // Try to get next key after last deleted
  let nextKey = delegate.getKeyBelow?.(lastKey);
  while (nextKey && keysToRemove.has(nextKey)) {
    nextKey = delegate.getKeyBelow?.(nextKey);
  }
  
  if (nextKey) return nextKey;
  
  // Try previous key before first deleted
  let firstKey = getFirstKey(keysToRemove, delegate);
  let prevKey = delegate.getKeyAbove?.(firstKey);
  while (prevKey && keysToRemove.has(prevKey)) {
    prevKey = delegate.getKeyAbove?.(prevKey);
  }
  
  return prevKey || null;
}
```

### 4. Accessibility Considerations

- **Screen Readers**: Announce when items are deleted (use live region)
- **Keyboard**: Only trigger on `Delete` or `Backspace` keys
- **Disabled items**: Should not be deletable
- **Selection modes**: 
  - Single selection: Delete focused item if selected
  - Multiple selection: Delete all selected items
  - No selection mode: No deletion (doesn't make sense)
- **Focus trap**: Ensure focus doesn't leave the ListBox unexpectedly

### 5. Testing Strategy

**Unit Tests** (`packages/react-aria-components/test/ListBox.test.js`):
- Delete single item with Backspace
- Delete single item with Delete key
- Delete multiple selected items
- Focus moves to next item after deletion
- Focus moves to previous item when deleting last item
- Disabled items are not deleted
- onRemove callback receives correct Set of keys
- List stays focused when all items deleted

**Integration Tests**:
- Test with virtualized ListBox
- Test with drag and drop enabled
- Test with different selection modes
- Test with keyboard navigation after deletion

**Manual Testing**:
- Screen reader testing (NVDA, JAWS, VoiceOver)
- Keyboard-only navigation
- Touch device testing (ensure no conflicts)

### 6. Documentation Updates

**Files to update:**
1. `packages/@react-aria/listbox/docs/useListBox.mdx` - Add onRemove documentation
2. `packages/react-aria-components/docs/ListBox.mdx` - Add examples
3. `packages/@react-spectrum/listbox/stories/ListBox.stories.tsx` - Add story demonstrating deletion

**Example story:**
```tsx
export const ListBoxWithDeletion: ListBoxStory = () => {
  let [items, setItems] = useState([
    {id: 1, name: 'Email 1'},
    {id: 2, name: 'Email 2'},
    {id: 3, name: 'Email 3'}
  ]);
  
  return (
    <ListBox 
      selectionMode="multiple"
      onRemove={(keys) => {
        setItems(items.filter(item => !keys.has(item.id)));
      }}>
      {items.map(item => (
        <ListBoxItem key={item.id}>{item.name}</ListBoxItem>
      ))}
    </ListBox>
  );
};
```

### 7. Alternative: `onKeyDown` Prop (Lower Priority)

If more flexibility is desired, could also add a low-level `onKeyDown` prop:
```typescript
onKeyDown?: (e: KeyboardEvent) => void
```

However, `onRemove` is preferred because:
- More declarative and easier to use
- Handles focus management automatically
- Consistent with TagGroup API
- Better accessibility out of the box

## Implementation Phases

### Phase 1: Core Implementation (Primary)
1. Add TypeScript interfaces for `onRemove`
2. Implement keyboard handling in `useSelectableCollection`
3. Add focus management logic
4. Thread prop through all layers

### Phase 2: Testing
1. Write unit tests
2. Add integration tests
3. Manual accessibility testing

### Phase 3: Documentation & Polish
1. Add documentation
2. Add Storybook examples
3. Update migration guides if needed

### Phase 4: Optional Enhancements
1. Add customizable keyboard shortcuts
2. Add confirmation dialog support
3. Add undo/redo support (out of scope for this feature)

## File Changes Checklist

- [ ] `packages/@react-types/listbox/src/index.d.ts` - Add onRemove type
- [ ] `packages/@react-types/shared/src/events.d.ts` - Add any new event types if needed
- [ ] `packages/@react-aria/listbox/src/useListBox.ts` - Store onRemove in listData
- [ ] `packages/@react-aria/listbox/src/utils.ts` - Update ListData interface
- [ ] `packages/@react-aria/selection/src/useSelectableCollection.ts` - Add Delete/Backspace handling
- [ ] `packages/react-aria-components/src/ListBox.tsx` - Update ListBoxProps interface
- [ ] `packages/@react-spectrum/listbox/src/ListBox.tsx` - Update Spectrum wrapper (if needed)
- [ ] `packages/@react-spectrum/s2/src/ListBox.tsx` - Update S2 wrapper
- [ ] `starters/docs/src/ListBox.tsx` - Update docs starter
- [ ] `starters/tailwind/src/ListBox.tsx` - Update tailwind starter
- [ ] `packages/react-aria-components/test/ListBox.test.js` - Add tests
- [ ] `packages/@react-aria/listbox/docs/useListBox.mdx` - Add documentation
- [ ] `packages/react-aria-components/docs/ListBox.mdx` - Add documentation
- [ ] `packages/react-aria-components/stories/ListBox.stories.tsx` - Add story

## Edge Cases to Handle

1. **Empty selection**: Don't call onRemove if nothing is selected
2. **Disabled items**: Skip disabled items in selection
3. **All items deleted**: Focus container, handle empty state
4. **Mixed selection**: Some selected items might be disabled
5. **Controlled state**: onRemove is a callback, user controls actual removal
6. **Virtualized lists**: Ensure focus management works with virtual scrolling
7. **Drag and drop**: Don't interfere with existing keyboard shortcuts
8. **Type-ahead**: Don't trigger on alphanumeric keys

## Accessibility Standards

Based on ARIA Authoring Practices Guide:
- Listbox role already supports item deletion conceptually
- No specific ARIA guidance on deletion, but TagGroup provides good precedent
- Announce deletions via aria-live region (optional enhancement)
- Ensure keyboard-only users can accomplish all tasks

## Success Criteria

✅ User can press Delete or Backspace to remove selected items
✅ Focus moves intelligently after deletion
✅ Works with single and multiple selection modes
✅ Callback provides Set of keys to remove
✅ Does not break existing functionality (onAction, drag and drop, etc.)
✅ Passes accessibility tests
✅ Documented with examples
✅ All tests pass

## Notes & Considerations

- This is marked as "good first issue" in the GitHub issue
- Implementation should be simple and follow existing patterns (TagGroup)
- Focus on developer experience - make it easy to use
- Consider backwards compatibility - this is a new optional prop
- May want to add `onBeforeRemove` for confirmation dialogs (future enhancement)

---

**Estimated Complexity**: Medium
**Estimated Time**: 2-3 days
- Day 1: Core implementation and prop threading
- Day 2: Focus management and testing
- Day 3: Documentation and polish

