import EmberObject, { set } from '@ember/object';
import TreeNode from './tree-node';

/**
 * A doubly linked list on top of a tree. The order of the list is in DFS order
 * for the tree. The list supports collapsing (hiding) of subtrees, after which
 * traversal of the linked list is the same as if the subtree had been removed.
 */
export default class LinkedListTree extends EmberObject {
  pointerNode = null;
  pointerIndex = -1;
  root = null;

  /**
   * First construct your tree using `new TreeNod(val)` and
   * `parent.addChild(childNode)`. Then, call constructor on the root node
   * of your tree. The root node does NOT get displayed.
   */
  constructor(root) {
    super();
    this.root = root;
    this._init();
  }

  /**
   * Moves the pointer back to the start of the list.
   */
  resetPointer() {
    this.pointerIndex = 0;
    // Root is a virtual node and will not be used for display
    if (this.root.children.length > 0) {
      this.pointerNode = this.root.children[0];
    } else {
      this.pointerNode = null;
    }
  }

  objectAt(index) {
    let direction = this.pointerIndex < index ? 1 : -1;
    while (index !== this.pointerIndex) {
      this.pointerNode = this.pointerNode.nextWithDirection(direction);
      this.pointerIndex += direction;
    }
    return this.pointerNode;
  }

  collapse(row) {
    // an collapse may mess up the pointer index, so we reset it
    this.resetPointer();
    this._collapse(row);
    this.notifyPropertyChange('[]');
  }

  expand(row) {
    // an expansion may mess up the pointer index, so we reset it
    this.resetPointer();
    this._expand(row);
    this.notifyPropertyChange('[]');
  }

  /**
   * Remove a row from the tree, rebuild the linked list and notify dependents that
   * the linked list has changed.
   */
  remove(row) {
    let i = row.parent.indexOf(row);
    row.parent.splice(i, 1);
    this._init();
  }

  /**
   * Create a new TreeNode with rowValue as its value and append it to the children of parent
   */
  add(rowValue, parent) {
    parent.children.push(new TreeNode(rowValue));
    this._init();
  }

  /**
   * Rebuilds the linked list structure, fills in all the count and depth fields.
   */
  _init() {
    this.root.initializePointers(null);
    this.root.initializeMetadata(-1, -1);
    this.resetPointer();
    this._recollapse(this.root);
    this.set('length', this.root.nodeCount - 1);
    this.notifyPropertyChange('[]');
  }

  /**
   * Expands the row; updates pointers and counts.
   */
  _expand(row) {
    if (!row.collapse) {
      return;
    }
    // Update next & previous link.
    let newNextNode = row.next;
    if (newNextNode !== null) {
      newNextNode.popPrevious();
    }
    row.next = row.originalNext;

    set(row, 'collapse', false);
    this._updateAncestorNodeCount(row, (row.nodeCount + row.nodeCountDelta) - 1);
  }

  /**
   * Collapse the row; updates pointers and counts.
   */
  _collapse(row) {
    if (row.collapse) {
      return;
    }
    // Update next & previous link.
    let newNextNode = row.nextOnCollapse;
    row.next = newNextNode;
    if (newNextNode !== null) {
      newNextNode.pushPrevious(row);
    }

    set(row, 'collapse', true);
    this._updateAncestorNodeCount(row, 1 - (row.nodeCount + row.nodeCountDelta));
  }

  /**
   * Traverse up the tree updating node counts and node delta counts.
   */
  _updateAncestorNodeCount(node, delta) {
    node = node.parent;
    while (node !== null) {
      node.nodeCountDelta += delta;
      node = node.parent;
    }
    this.set('length', this.get('length') + delta);
  }

  /**
   * Go thru the tree, collapsing everything marked as collapsed.
   */
  _recollapse(node) {
    for (let child of node.children) {
      // collapse child nodes before me.
      this._recollapse(child);

      if (child.collapse) {
        this._collapse(child);
      }
    }
  }
}
