import { Component } from '@theme/component';
import { debounce, onDocumentLoaded, setHeaderMenuStyle } from '@theme/utilities';
import { MegaMenuHoverEvent } from '@theme/events';

/**
 * A custom element that manages a header menu.
 *
 * @typedef {Object} State
 * @property {HTMLElement | null} activeItem - The currently active menu item.
 *
 * @typedef {object} Refs
 * @property {HTMLElement} overflowMenu - The overflow menu.
 * @property {HTMLElement[]} [submenu] - The submenu in each respective menu item.
 *
 * @extends {Component<Refs>}
 */
class HeaderMenu extends Component {
  requiredRefs = ['overflowMenu'];

  /**
   * @type {MutationObserver | null}
   */
  #submenuMutationObserver = null;

  connectedCallback() {
    super.connectedCallback();

    onDocumentLoaded(this.#preloadImages);
    this.#setupHoverPanelImageFade();
    window.addEventListener('resize', this.#resizeListener);
    this.overflowMenu?.addEventListener('pointerleave', this.#overflowSubmenuListener);
    // Native (bubbling) listener rather than a declarative `on:focus`, so keyboard focus on a
    // category link updates its hover-swap panel without shadowing the outer list item's
    // `on:focus="/activate"` (the declarative event system resolves to the closest ancestor
    // with the same attribute, so a second `on:focus` on the link itself would take over instead
    // — see `activateHoverPanel`).
    this.addEventListener('focusin', this.#onHoverPanelFocusIn);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('resize', this.#resizeListener);
    clearTimeout(this.#deactivateTimer);
    clearTimeout(this.#activateTimer);
    document.body.removeEventListener('pointermove', this.#onPointerMove);
    if (this.#state.activeItem) {
      this.#stopPointerTracking(this.#state.activeItem);
    }
    this.overflowMenu?.removeEventListener('pointerleave', this.#overflowSubmenuListener);
    this.removeEventListener('load', this.#onHoverPanelImageLoad, true);
    this.removeEventListener('focusin', this.#onHoverPanelFocusIn);
    this.#cleanupMutationObserver();
  }

  /**
   * @param {FocusEvent} event
   */
  #onHoverPanelFocusIn = (event) => {
    if (event.target instanceof HTMLElement && event.target.dataset.hoverKey) {
      this.activateHoverPanel(event);
    }
  };

  /**
   * Debounced resize event listener to recalculate menu style
   */
  #resizeListener = debounce(() => {
    setHeaderMenuStyle();
  }, 100);

  #overflowSubmenuListener = () => {
    this.#deactivate();
  };

  /**
   * @type {State}
   */
  #state = {
    activeItem: null,
  };

  /**
   * @type {ReturnType<typeof setTimeout> | undefined}
   */
  #pointerIdleTimer;

  /**
   * Pending close, re-armed by `#onPointerMove` for as long as the pointer keeps moving outside
   * the trigger/submenu, so a diagonal move toward either side of the dropdown doesn't get
   * closed out from under it mid-transit.
   * @type {ReturnType<typeof setTimeout> | undefined}
   */
  #deactivateTimer;

  /**
   * Pending switch to a different top-level item while one is already open. A diagonal move
   * toward a far column of the open dropdown often has to sweep across an earlier sibling item
   * in the nav row on the way there (e.g. reaching a right-hand column means crossing whatever
   * item sits immediately to the right of the trigger) — that's a fly-by, not a real hover, so
   * it shouldn't instantly steal the still-open dropdown out from under the pointer.
   * @type {ReturnType<typeof setTimeout> | undefined}
   */
  #activateTimer;

  /**
   * Last known pointer position for Safari hit-test reconciliation.
   * @type {{ x: number, y: number }}
   */
  #lastPointer = { x: 0, y: 0 };

  /**
   * Update the safety box idle state on the active menu item.
   * @param {PointerEvent} event
   */
  #onPointerMove = (event) => {
    const activeLink = this.#state.activeItem;
    if (!activeLink) return;

    this.#lastPointer.x = event.clientX;
    this.#lastPointer.y = event.clientY;

    const moving = Math.abs(event.movementX) >= 1 || Math.abs(event.movementY) >= 1;
    activeLink.dataset.safetyBox = `${moving}`;

    // A diagonal move from the trigger toward either side of a (potentially very wide) mega
    // menu spends time in transit over neither the trigger nor the submenu. As long as the
    // pointer keeps moving at all, keep pushing the close out — see `#scheduleDeactivate` —
    // instead of closing on a single fixed delay that a long/slow diagonal can outlast. Once
    // the pointer actually lands on the trigger or submenu, cancel the pending close outright.
    const li = activeLink.closest('.menu-list__list-item');
    const submenu = findSubmenu(activeLink);
    if (li?.matches(':hover') || submenu?.matches(':hover')) {
      clearTimeout(this.#deactivateTimer);
    } else {
      this.#scheduleDeactivate(activeLink);
    }

    clearTimeout(this.#pointerIdleTimer);
    if (moving) {
      this.#pointerIdleTimer = setTimeout(() => {
        if (this.#state.activeItem) {
          this.#state.activeItem.dataset.safetyBox = 'false';
          this.#reconcilePointerTarget();
        }
      }, 50);
    } else {
      this.#reconcilePointerTarget();
    }
  };

  /**
   * Check if the pointer is over a different menu item and trigger activation if so.
   * Works around Safari not re-evaluating hit targets after pseudo-element changes.
   */
  #reconcilePointerTarget() {
    const { x, y } = this.#lastPointer;
    requestAnimationFrame(() => {
      const target = document.elementFromPoint(x, y);
      if (!target) return;
      const listItem = target.closest('.menu-list__list-item');
      if (listItem && !listItem.contains(this.#state.activeItem)) {
        listItem.dispatchEvent(new PointerEvent('pointerenter', { bubbles: false }));
      }
    });
  }

  /**
   * Begin pointer tracking for the safety box on the newly active item.
   * @param {HTMLElement} item
   * @param {HTMLElement | null} previousItem
   */
  #startPointerTracking(item, previousItem) {
    if (previousItem) {
      this.#stopPointerTracking(previousItem);
    } else {
      document.body.addEventListener('pointermove', this.#onPointerMove);
    }

    const rect = item.getBoundingClientRect();
    const isOverlap = this.headerComponent?.hasAttribute('data-submenu-overlap-bottom-row');
    const boundary = isOverlap ? this.headerComponent?.querySelector('.header__row--top') : this.headerComponent;
    item.style.setProperty('--box-height', `${(boundary?.getBoundingClientRect().bottom ?? 0) - rect.top}px`);
  }

  /**
   * Stop pointer tracking and remove all safety box properties from an item.
   * @param {HTMLElement} item
   */
  #stopPointerTracking(item) {
    clearTimeout(this.#pointerIdleTimer);
    this.#pointerIdleTimer = undefined;
    item.style.removeProperty('--box-height');
    delete item.dataset.safetyBox;
  }

  /**
   * Get the overflow menu
   */
  get overflowMenu() {
    return /** @type {HTMLElement | null} */ (this.refs.overflowMenu?.shadowRoot?.querySelector('[part="overflow"]'));
  }

  /**
   * Whether the overflow list is hovered
   * @returns {boolean}
   */
  get overflowListHovered() {
    return this.refs.overflowMenu?.shadowRoot?.querySelector('[part="overflow-list"]')?.matches(':hover') ?? false;
  }

  get headerComponent() {
    return /** @type {HTMLElement | null} */ (this.closest('header-component'));
  }

  /**
   * Activate the selected menu item, immediately in the common case. If a different item is
   * already open and this came from a pointer (not keyboard focus), the switch is held for a
   * brief hover-intent check first — see `#activateTimer`.
   * @param {PointerEvent | FocusEvent} event
   */
  activate = (event) => {
    clearTimeout(this.#deactivateTimer);
    this.dispatchEvent(new MegaMenuHoverEvent());

    if (!(event.target instanceof Element) || !this.headerComponent) return;

    const item = findMenuItem(event.target);

    if (!item || item == this.#state.activeItem) return;

    if (this.#state.activeItem && event instanceof PointerEvent) {
      clearTimeout(this.#activateTimer);
      this.#activateTimer = setTimeout(() => {
        if (item.closest('.menu-list__list-item')?.matches(':hover')) {
          this.#commitActivate(item, event);
        }
      }, 100);
      return;
    }

    this.#commitActivate(item, event);
  };

  /**
   * @param {HTMLElement} item
   * @param {PointerEvent | FocusEvent} event
   */
  #commitActivate(item, event) {
    if (!this.headerComponent) return;

    const isDefaultSlot = event.target instanceof Element && event.target.slot === '';

    this.dataset.overflowExpanded = (!isDefaultSlot).toString();

    const previouslyActiveItem = this.#state.activeItem;

    if (previouslyActiveItem) {
      previouslyActiveItem.ariaExpanded = 'false';
    }

    this.#state.activeItem = item;
    this.ariaExpanded = 'true';
    item.ariaExpanded = 'true';

    let submenu = findSubmenu(item);
    const hasSubmenu = Boolean(submenu);

    if (!hasSubmenu && !isDefaultSlot) {
      submenu = this.overflowMenu;
    }

    if (submenu) {
      // Mark submenu as active for content-visibility optimization
      submenu.dataset.active = '';

      // Cleanup any existing mutation observer from previous menu activations
      this.#cleanupMutationObserver();

      // Monitor DOM mutations to catch deferred content injection (from section hydration)
      this.#submenuMutationObserver = new MutationObserver(() => {
        requestAnimationFrame(() => {
          // Double requestAnimationFrame to ensure the height is properly calculated and not defaulting to the contain-intrinsic-size
          requestAnimationFrame(() => {
            if (submenu.offsetHeight > 0) {
              this.headerComponent?.style.setProperty('--submenu-height', `${submenu.offsetHeight}px`);
              this.#cleanupMutationObserver();
            }
          });
        });
      });
      this.#submenuMutationObserver.observe(submenu, { childList: true, subtree: true });

      // Auto-disconnect after 500ms to prevent memory leaks
      setTimeout(() => {
        this.#cleanupMutationObserver();
      }, 500);
    }

    let finalHeight = submenu?.offsetHeight || 0;

    // For overflow menu, the height needs to be either content of the submenu or the total height of the menu list links
    if (!isDefaultSlot) {
      const overflowListHeight = this.#getOverflowListLinksHeight();
      if (hasSubmenu) {
        /* Note: When the submenu is inside the overflow menu, its offsetHeight is not valid due to the lack of padding
         * we could add the padding variables to the submenu.offsetHeight, but measuring the overflowMenu.offsetHeight is just easier */
        const overflowHeight = this.overflowMenu?.offsetHeight || 0;
        finalHeight = Math.max(overflowHeight, overflowListHeight);
      } else {
        finalHeight = overflowListHeight;
      }
    }

    if (!submenu) {
      // If there is no content to open, don't try to open it
      finalHeight = 0;
    }

    this.headerComponent.style.setProperty('--submenu-height', `${finalHeight}px`);
    this.#setFullOpenHeaderHeight(finalHeight);
    this.style.setProperty('--submenu-opacity', '1');
    this.#startPointerTracking(item, previouslyActiveItem);
  }

  /**
   * Track the last-hovered category of a category-hover-swap submenu (see `[data-panel]` in
   * mega-menu-list.liquid) so its panel stays visible while the pointer travels from the
   * category link toward the panel itself. The panel swap used to be driven purely by `:hover`
   * on the category link, which reverted to the default panel the instant the pointer left that
   * link — including mid-transit on a diagonal move toward the panel it had just opened.
   * @param {PointerEvent | FocusEvent} event
   */
  activateHoverPanel = (event) => {
    if (!(event.target instanceof HTMLElement)) return;

    const grid = event.target.closest('[data-menu-grid-id]');
    const hoverKey = event.target.dataset.hoverKey;

    if (!(grid instanceof HTMLElement) || !hoverKey) return;

    grid.dataset.activePanel = hoverKey;
  };

  /**
   * Deactivate the active item after a delay
   * @param {PointerEvent | FocusEvent} event
   */
  deactivate(event) {
    if (!(event.target instanceof Element)) return;

    // A leave whose relatedTarget is a descendant of the element being left isn't a real
    // leave — the browser can fire this spuriously right after the safety-box pseudo-element
    // toggles under a stationary-ish pointer, and it would otherwise close the menu the pointer
    // is still over, with no compensating re-entry (the recovering pointerenter targets the
    // descendant, not this element, so it's invisible to the declarative event system).
    if (event.relatedTarget instanceof Node && event.target.contains(event.relatedTarget)) return;

    const menu = findSubmenu(this.#state.activeItem);
    const isMovingWithinMenu = event.relatedTarget instanceof Node && menu?.contains(document.activeElement);
    const isMovingToSubmenu =
      event.relatedTarget instanceof Node && event.type === 'blur' && menu?.contains(event.relatedTarget);
    const isMovingToOverflowMenu =
      event.relatedTarget instanceof Node && event.relatedTarget.parentElement?.matches('[slot="overflow"]');

    if (isMovingWithinMenu || isMovingToOverflowMenu || isMovingToSubmenu) {
      if (this.#state.activeItem) {
        this.#stopPointerTracking(this.#state.activeItem);
      }
      return;
    }

    this.#scheduleDeactivate();
  }

  /**
   * Schedule deactivation after a short grace period instead of closing immediately. Re-armed
   * on every pointer move while the pointer is outside the trigger/submenu (see `#onPointerMove`),
   * so a diagonal move toward either side of the dropdown keeps deferring the close for as long
   * as the pointer keeps moving, however far or slow the diagonal is — it only actually fires
   * once movement settles (or `deactivate` calls it once, unrenewed, for a plain leave). Cancelled
   * by `activate` if the pointer lands back on the trigger or a different item; re-confirmed
   * against the trigger/submenu hover state when the timer fires so a genuine move away still
   * closes the menu.
   * @param {HTMLElement | null} [item]
   */
  #scheduleDeactivate(item = this.#state.activeItem) {
    clearTimeout(this.#deactivateTimer);

    this.#deactivateTimer = setTimeout(() => {
      if (!item || item !== this.#state.activeItem) return;

      const li = item.closest('.menu-list__list-item');
      const menu = findSubmenu(item);

      if (li?.matches(':hover') || menu?.matches(':hover')) return;

      this.#deactivate(item);
    }, 300);
  }

  /**
   * Deactivate the active item immediately
   * @param {HTMLElement | null} [item]
   */
  #deactivate = (item = this.#state.activeItem) => {
    if (!item || item != this.#state.activeItem) return;

    // Don't deactivate if the overflow menu or overflow list is still being hovered
    if (this.overflowListHovered || this.overflowMenu?.matches(':hover')) return;

    this.headerComponent?.style.setProperty('--submenu-height', '0px');
    this.#setFullOpenHeaderHeight(0);
    this.style.setProperty('--submenu-opacity', '0');
    this.dataset.overflowExpanded = 'false';

    const submenu = findSubmenu(item);

    document.body.removeEventListener('pointermove', this.#onPointerMove);
    this.#stopPointerTracking(item);

    this.#state.activeItem = null;
    this.ariaExpanded = 'false';
    item.ariaExpanded = 'false';

    // Remove active state from submenu after animation completes
    if (submenu) {
      delete submenu.dataset.active;

      // Reset the category hover-swap panel (see `activateHoverPanel`) so the next time this
      // submenu opens, it starts back on the default panel instead of wherever it was left.
      const grid = submenu.querySelector('[data-menu-grid-id]');
      if (grid instanceof HTMLElement) {
        delete grid.dataset.activePanel;
      }
    }
  };

  #getOverflowListLinksHeight() {
    const slottedMenuLinks = this.overflowMenu?.querySelector('slot')?.assignedElements();
    if (!slottedMenuLinks) return this.overflowMenu?.offsetHeight || 0;

    /**
     * @param {(submenu: HTMLElement) => void} cb
     */
    const mapSubmenus = (cb) => {
      slottedMenuLinks.forEach((link) => {
        const submenu = /** @type {HTMLElement | null} */ (link.querySelector('[ref="submenu[]"]'));
        if (submenu) {
          cb(submenu);
        }
      });
    };

    mapSubmenus((submenu) => {
      submenu.style.setProperty('display', 'none');
    });
    const height = this.overflowMenu?.offsetHeight || 0;
    mapSubmenus((submenu) => {
      submenu.style.removeProperty('display');
    });
    return height;
  }

  /**
   * Calculate and set the full open header height. If the submenu is not open, the full open header height is 0.
   * @param {number} submenuHeight
   */
  #setFullOpenHeaderHeight(submenuHeight) {
    if (!this.headerComponent) return;

    const isOverlapSituation = this.headerComponent.hasAttribute('data-submenu-overlap-bottom-row');

    const headerVisibleHeight =
      isOverlapSituation && this.headerComponent.offsetHeight > 0
        ? /** @type {HTMLElement | null} */ (this.headerComponent.querySelector('.header__row--top'))?.offsetHeight ?? 0
        : this.headerComponent.offsetHeight;

    const nothingToOpen = submenuHeight === 0;
    const fullOpenHeaderHeight = nothingToOpen ? 0 : submenuHeight + (headerVisibleHeight ?? 0);

    this.headerComponent?.style.setProperty('--full-open-header-height', `${fullOpenHeaderHeight}px`);
  }

  /**
   * Preload images that are set to load lazily.
   *
   * Category hover-swap panels (`[data-panel]`, see mega-menu-list.liquid) are an exception:
   * only the default/initially-visible panel's images are preloaded here. The other panels stay
   * lazy and fade in on first hover (see #setupHoverPanelImageFade) so hovering categories the
   * visitor never looks at doesn't force extra image downloads on every page load.
   */
  #preloadImages = () => {
    const images = this.querySelectorAll('img[loading="lazy"]');
    images?.forEach((image) => {
      const hoverPanel = image.closest('[data-panel]');
      if (hoverPanel && !hoverPanel.hasAttribute('data-panel-default')) return;
      image.removeAttribute('loading');
    });
  };

  /**
   * Fade in hover-panel images as they load, instead of letting them pop in abruptly the first
   * time a non-default category is hovered (its images are still `loading="lazy"` at that point).
   */
  #setupHoverPanelImageFade = () => {
    this.querySelectorAll('[data-panel] img').forEach((image) => {
      if (image instanceof HTMLImageElement && image.complete) image.classList.add('is-loaded');
    });

    // 'load' doesn't bubble, but a capture-phase listener still observes it on the way down.
    this.addEventListener('load', this.#onHoverPanelImageLoad, true);
  };

  /**
   * @param {Event} event
   */
  #onHoverPanelImageLoad = (event) => {
    const image = event.target;
    if (image instanceof HTMLImageElement && image.closest('[data-panel]')) {
      image.classList.add('is-loaded');
    }
  };

  #cleanupMutationObserver() {
    this.#submenuMutationObserver?.disconnect();
    this.#submenuMutationObserver = null;
  }
}

if (!customElements.get('header-menu')) {
  customElements.define('header-menu', HeaderMenu);
}

/**
 * Find the closest menu item.
 * @param {Element | null | undefined} element
 * @returns {HTMLElement | null}
 */
function findMenuItem(element) {
  if (!(element instanceof Element)) return null;

  if (element?.matches('[slot="more"')) {
    // Select the first overflowing menu item when hovering over the "More" item
    return findMenuItem(element.parentElement?.querySelector('[slot="overflow"]'));
  }

  return element?.querySelector('[ref="menuitem"]');
}

/**
 * Find the closest submenu.
 * @param {Element | null | undefined} element
 * @returns {HTMLElement | null}
 */
function findSubmenu(element) {
  const submenu = element?.parentElement?.querySelector('[ref="submenu[]"]');
  return submenu instanceof HTMLElement ? submenu : null;
}
