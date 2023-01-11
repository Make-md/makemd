import {
  EditorView,
  ViewPlugin,
  ViewUpdate,
  Direction,
  logException,
} from "@codemirror/view";
import {
  EditorState,
  StateEffect,
  StateEffectType,
  Facet,
  StateField,
  Extension,
  MapMode,
} from "@codemirror/state";

/**
 * Codemirror tooltip
 * https://github.com/codemirror/tooltip
 * Marijn Haverbeke <marijnh@gmail.com> and others
 *
 * Fork to fix hover position
 **/

const ios =
  typeof navigator != "undefined" &&
  !/Edge\/(\d+)/.exec(navigator.userAgent) &&
  /Apple Computer/.test(navigator.vendor) &&
  (/Mobile\/\w+/.test(navigator.userAgent) || navigator.maxTouchPoints > 2);

type Rect = { left: number; right: number; top: number; bottom: number };

type Measured = {
  editor: DOMRect;
  parent: DOMRect;
  pos: (Rect | null)[];
  size: DOMRect[];
  space: { left: number; top: number; right: number; bottom: number };
};

const Outside = "-10000px";

const enum Arrow {
  Size = 7,
  Offset = 14,
}

class TooltipViewManager {
  private input: readonly (Tooltip | null)[];
  tooltips: readonly Tooltip[];
  tooltipViews: readonly TooltipView[];

  constructor(
    view: EditorView,
    private readonly facet: Facet<Tooltip | null>,
    private readonly createTooltipView: (tooltip: Tooltip) => TooltipView
  ) {
    this.input = view.state.facet(facet);
    this.tooltips = this.input.filter((t) => t) as Tooltip[];
    this.tooltipViews = this.tooltips.map(createTooltipView);
  }

  update(update: ViewUpdate) {
    let input = update.state.facet(this.facet);
    let tooltips = input.filter((x) => x) as Tooltip[];
    if (input === this.input) {
      for (let t of this.tooltipViews) if (t.update) t.update(update);
      return false;
    }

    let tooltipViews = [];
    for (let i = 0; i < tooltips.length; i++) {
      let tip = tooltips[i],
        known = -1;
      if (!tip) continue;
      for (let i = 0; i < this.tooltips.length; i++) {
        let other = this.tooltips[i];
        if (other && other.create == tip.create) known = i;
      }
      if (known < 0) {
        tooltipViews[i] = this.createTooltipView(tip);
      } else {
        let tooltipView = (tooltipViews[i] = this.tooltipViews[known]);
        if (tooltipView.update) tooltipView.update(update);
      }
    }
    for (let t of this.tooltipViews)
      if (tooltipViews.indexOf(t) < 0) t.dom.remove();

    this.input = input;
    this.tooltips = tooltips;
    this.tooltipViews = tooltipViews;
    return true;
  }
}

/// Return an extension that configures tooltip behavior.
export function tooltips(
  config: {
    /// By default, tooltips use `"fixed"`
    /// [positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/position),
    /// which has the advantage that tooltips don't get cut off by
    /// scrollable parent elements. However, CSS rules like `contain:
    /// layout` can break fixed positioning in child nodes, which can be
    /// worked about by using `"absolute"` here.
    ///
    /// On iOS, which at the time of writing still doesn't properly
    /// support fixed positioning, the library always uses absolute
    /// positioning.
    position?: "fixed" | "absolute";
    /// The element to put the tooltips into. By default, they are put
    /// in the editor (`cm-editor`) element, and that is usually what
    /// you want. But in some layouts that can lead to positioning
    /// issues, and you need to use a different parent to work around
    /// those.
    parent?: HTMLElement;
    /// By default, when figuring out whether there is room for a
    /// tooltip at a given position, the extension considers the entire
    /// space between 0,0 and `innerWidth`,`innerHeight` to be available
    /// for showing tooltips. You can provide a function here that
    /// returns an alternative rectangle.
    tooltipSpace?: (view: EditorView) => {
      top: number;
      left: number;
      bottom: number;
      right: number;
    };
  } = {}
): Extension {
  return tooltipConfig.of(config);
}

type TooltipConfig = {
  position: "fixed" | "absolute";
  parent: ParentNode | null;
  tooltipSpace: (view: EditorView) => {
    top: number;
    left: number;
    bottom: number;
    right: number;
  };
};

function windowSpace() {
  return { top: 0, left: 0, bottom: innerHeight, right: innerWidth };
}

const tooltipConfig = Facet.define<Partial<TooltipConfig>, TooltipConfig>({
  combine: (values) => ({
    position: ios
      ? "absolute"
      : values.find((conf) => conf.position)?.position || "fixed",
    parent: values.find((conf) => conf.parent)?.parent || null,
    tooltipSpace:
      values.find((conf) => conf.tooltipSpace)?.tooltipSpace || windowSpace,
  }),
});

const tooltipPlugin = ViewPlugin.fromClass(
  class {
    manager: TooltipViewManager;
    measureReq: {
      read: () => Measured;
      write: (m: Measured) => void;
      key: any;
    };
    inView = true;
    position: "fixed" | "absolute";
    parent: ParentNode | null;
    container!: HTMLElement;
    classes: string;
    intersectionObserver: IntersectionObserver | null;
    lastTransaction = 0;
    measureTimeout = -1;

    constructor(readonly view: EditorView) {
      let config = view.state.facet(tooltipConfig);
      this.position = config.position;
      this.parent = config.parent;
      this.classes = view.themeClasses;
      this.createContainer();
      this.measureReq = {
        read: this.readMeasure.bind(this),
        write: this.writeMeasure.bind(this),
        key: this,
      };
      this.manager = new TooltipViewManager(view, showTooltip, (t) =>
        this.createTooltip(t)
      );
      this.intersectionObserver =
        typeof IntersectionObserver == "function"
          ? new IntersectionObserver(
              (entries) => {
                if (
                  Date.now() > this.lastTransaction - 50 &&
                  entries.length > 0 &&
                  entries[entries.length - 1].intersectionRatio < 1
                )
                  this.measureSoon();
              },
              { threshold: [1] }
            )
          : null;
      this.observeIntersection();
      view.dom.ownerDocument.defaultView?.addEventListener(
        "resize",
        (this.measureSoon = this.measureSoon.bind(this))
      );
      this.maybeMeasure();
    }

    createContainer() {
      if (this.parent) {
        this.container = document.createElement("div");
        this.container.style.position = "relative";
        this.container.className = this.view.themeClasses;
        this.parent.appendChild(this.container);
      } else {
        this.container = this.view.dom;
      }
    }

    observeIntersection() {
      if (this.intersectionObserver) {
        this.intersectionObserver.disconnect();
        for (let tooltip of this.manager.tooltipViews)
          this.intersectionObserver.observe(tooltip.dom);
      }
    }

    measureSoon() {
      if (this.measureTimeout < 0)
        //@ts-ignore
        this.measureTimeout = setTimeout(() => {
          this.measureTimeout = -1;
          this.maybeMeasure();
        }, 50);
    }

    update(update: ViewUpdate) {
      if (update.transactions.length) this.lastTransaction = Date.now();
      let updated = this.manager.update(update);
      if (updated) this.observeIntersection();
      let shouldMeasure = updated || update.geometryChanged;
      let newConfig = update.state.facet(tooltipConfig);
      if (newConfig.position != this.position) {
        this.position = newConfig.position;
        for (let t of this.manager.tooltipViews)
          t.dom.style.position = this.position;
        shouldMeasure = true;
      }
      if (newConfig.parent != this.parent) {
        if (this.parent) this.container.remove();
        this.parent = newConfig.parent;
        this.createContainer();
        for (let t of this.manager.tooltipViews)
          this.container.appendChild(t.dom);
        shouldMeasure = true;
      } else if (this.parent && this.view.themeClasses != this.classes) {
        this.classes = this.container.className = this.view.themeClasses;
      }
      if (shouldMeasure) this.maybeMeasure();
    }

    createTooltip(tooltip: Tooltip) {
      let tooltipView = tooltip.create(this.view);
      tooltipView.dom.classList.add("cm-tooltip");
      if (
        tooltip.arrow &&
        !tooltipView.dom.querySelector(".cm-tooltip > .cm-tooltip-arrow")
      ) {
        let arrow = document.createElement("div");
        arrow.className = "cm-tooltip-arrow";
        tooltipView.dom.appendChild(arrow);
      }
      tooltipView.dom.style.position = this.position;
      tooltipView.dom.style.top = Outside;
      this.container.appendChild(tooltipView.dom);
      if (tooltipView.mount) tooltipView.mount(this.view);
      return tooltipView;
    }

    destroy() {
      this.view.dom.ownerDocument.defaultView?.removeEventListener(
        "resize",
        this.measureSoon
      );
      for (let { dom } of this.manager.tooltipViews) dom.remove();
      this.intersectionObserver?.disconnect();
      clearTimeout(this.measureTimeout);
    }

    readMeasure() {
      let editor = this.view.dom.getBoundingClientRect();
      return {
        editor,
        parent: this.parent ? this.container.getBoundingClientRect() : editor,
        pos: this.manager.tooltips.map((t, i) => {
          let tv = this.manager.tooltipViews[i];
          return tv.getCoords
            ? tv.getCoords(t.pos)
            : this.view.coordsAtPos(t.pos);
        }),
        size: this.manager.tooltipViews.map(({ dom }) =>
          dom.getBoundingClientRect()
        ),
        space: this.view.state.facet(tooltipConfig).tooltipSpace(this.view),
      };
    }

    writeMeasure(measured: Measured) {
      let { editor, space } = measured;
      let others = [];
      for (let i = 0; i < this.manager.tooltips.length; i++) {
        let tooltip = this.manager.tooltips[i],
          tView = this.manager.tooltipViews[i],
          { dom } = tView;
        let pos = measured.pos[i],
          size = measured.size[i];
        // Hide tooltips that are outside of the editor.
        if (
          !pos ||
          pos.bottom <= Math.max(editor.top, space.top) ||
          pos.top >= Math.min(editor.bottom, space.bottom) ||
          pos.right < Math.max(editor.left, space.left) - 0.1 ||
          pos.left > Math.min(editor.right, space.right) + 0.1
        ) {
          dom.style.top = Outside;
          continue;
        }
        let arrow: HTMLElement | null = tooltip.arrow
          ? tView.dom.querySelector(".cm-tooltip-arrow")
          : null;
        let arrowHeight = arrow ? Arrow.Size : 0;
        let width = size.right - size.left,
          height = size.bottom - size.top;
        let offset = tView.offset || noOffset,
          ltr = this.view.textDirection == Direction.LTR;
        let left =
          size.width > space.right - space.left
            ? ltr
              ? space.left
              : space.right - size.width
            : ltr
            ? Math.min(
                pos.left - (arrow ? Arrow.Offset : 0) + offset.x,
                space.right - width
              )
            : Math.max(
                space.left,
                pos.left - width + (arrow ? Arrow.Offset : 0) - offset.x
              );
        let above = !!tooltip.above;
        if (
          !tooltip.strictSide &&
          (above
            ? pos.top - (size.bottom - size.top) - offset.y < space.top
            : pos.bottom + (size.bottom - size.top) + offset.y >
              space.bottom) &&
          above == space.bottom - pos.bottom > pos.top - space.top
        )
          above = !above;
        let top = above
          ? pos.top - height - arrowHeight - offset.y
          : pos.bottom + arrowHeight + offset.y;
        let right = left + width;
        if (tView.overlap !== true)
          for (let r of others)
            if (
              r.left < right &&
              r.right > left &&
              r.top < top + height &&
              r.bottom > top
            )
              top = above
                ? r.top - height - 2 - arrowHeight
                : r.bottom + arrowHeight + 2;
        if (this.position == "absolute") {
          dom.style.top = top - measured.parent.top + "px";
          dom.style.left = left - measured.parent.left + "px";
        } else {
          dom.style.top = top + "px";
          dom.style.left = left + "px";
        }
        if (arrow)
          arrow.style.left = `${
            pos.left +
            (ltr ? offset.x : -offset.x) -
            (left + Arrow.Offset - Arrow.Size)
          }px`;

        if (tView.overlap !== true)
          others.push({ left, top, right, bottom: top + height });
        dom.classList.toggle("cm-tooltip-above", above);
        dom.classList.toggle("cm-tooltip-below", !above);
        if (tView.positioned) tView.positioned();
      }
    }

    maybeMeasure() {
      if (this.manager.tooltips.length) {
        if (this.view.inView) this.view.requestMeasure(this.measureReq);
        if (this.inView != this.view.inView) {
          this.inView = this.view.inView;
          if (!this.inView)
            for (let tv of this.manager.tooltipViews)
              tv.dom.style.top = Outside;
        }
      }
    }
  },
  {
    eventHandlers: {
      scroll() {
        this.maybeMeasure();
      },
    },
  }
);

const baseTheme = EditorView.baseTheme({
  ".cm-tooltip": {
    zIndex: 100,
  },
  "&light .cm-tooltip": {
    border: "1px solid #bbb",
    backgroundColor: "#f5f5f5",
  },
  "&light .cm-tooltip-section:not(:first-child)": {
    borderTop: "1px solid #bbb",
  },
  "&dark .cm-tooltip": {
    backgroundColor: "#333338",
    color: "white",
  },
  ".cm-tooltip-arrow": {
    height: `${Arrow.Size}px`,
    width: `${Arrow.Size * 2}px`,
    position: "absolute",
    zIndex: -1,
    overflow: "hidden",
    "&:before, &:after": {
      content: "''",
      position: "absolute",
      width: 0,
      height: 0,
      borderLeft: `${Arrow.Size}px solid transparent`,
      borderRight: `${Arrow.Size}px solid transparent`,
    },
    ".cm-tooltip-above &": {
      bottom: `-${Arrow.Size}px`,
      "&:before": {
        borderTop: `${Arrow.Size}px solid #bbb`,
      },
      "&:after": {
        borderTop: `${Arrow.Size}px solid #f5f5f5`,
        bottom: "1px",
      },
    },
    ".cm-tooltip-below &": {
      top: `-${Arrow.Size}px`,
      "&:before": {
        borderBottom: `${Arrow.Size}px solid #bbb`,
      },
      "&:after": {
        borderBottom: `${Arrow.Size}px solid #f5f5f5`,
        top: "1px",
      },
    },
  },
  "&dark .cm-tooltip .cm-tooltip-arrow": {
    "&:before": {
      borderTopColor: "#333338",
      borderBottomColor: "#333338",
    },
    "&:after": {
      borderTopColor: "transparent",
      borderBottomColor: "transparent",
    },
  },
});

/// Describes a tooltip. Values of this type, when provided through
/// the [`showTooltip`](#tooltip.showTooltip) facet, control the
/// individual tooltips on the editor.
export interface Tooltip {
  /// The document position at which to show the tooltip.
  pos: number;
  /// The end of the range annotated by this tooltip, if different
  /// from `pos`.
  end?: number;
  /// A constructor function that creates the tooltip's [DOM
  /// representation](#tooltip.TooltipView).
  create(view: EditorView): TooltipView;
  /// Whether the tooltip should be shown above or below the target
  /// position. Not guaranteed for hover tooltips since all hover
  /// tooltips for the same range are always positioned together.
  /// Defaults to false.
  above?: boolean;
  /// Whether the `above` option should be honored when there isn't
  /// enough space on that side to show the tooltip inside the
  /// viewport. Not guaranteed for hover tooltips. Defaults to false.
  strictSide?: boolean;
  /// When set to true, show a triangle connecting the tooltip element
  /// to position `pos`.
  arrow?: boolean;
}

/// Describes the way a tooltip is displayed.
export interface TooltipView {
  /// The DOM element to position over the editor.
  dom: HTMLElement;
  /// Adjust the position of the tooltip relative to its anchor
  /// position. A positive `x` value will move the tooltip
  /// horizontally along with the text direction (so right in
  /// left-to-right context, left in right-to-left). A positive `y`
  /// will move the tooltip up when it is above its anchor, and down
  /// otherwise.
  offset?: { x: number; y: number };
  /// By default, a tooltip's screen position will be based on the
  /// text position of its `pos` property. This method can be provided
  /// to make the tooltip view itself responsible for finding its
  /// screen position.
  getCoords?: (pos: number) => Rect;
  /// By default, tooltips are moved when they overlap with other
  /// tooltips. Set this to `true` to disable that behavior for this
  /// tooltip.
  overlap?: boolean;
  /// Called after the tooltip is added to the DOM for the first time.
  mount?(view: EditorView): void;
  /// Update the DOM element for a change in the view's state.
  update?(update: ViewUpdate): void;
  /// Called when the tooltip has been (re)positioned.
  positioned?(): void;
}

const noOffset = { x: 0, y: 0 };

/// Behavior by which an extension can provide a tooltip to be shown.
export const showTooltip = Facet.define<Tooltip | null>({
  enables: [tooltipPlugin, baseTheme],
});

const showHoverTooltip = Facet.define<Tooltip | null>();

class HoverTooltipHost implements TooltipView {
  private readonly manager: TooltipViewManager;
  dom: HTMLElement;
  mounted: boolean = false;

  // Needs to be static so that host tooltip instances always match
  static create(view: EditorView) {
    return new HoverTooltipHost(view);
  }

  private constructor(readonly view: EditorView) {
    this.dom = document.createElement("div");
    this.dom.classList.add("cm-tooltip-hover");
    this.manager = new TooltipViewManager(view, showHoverTooltip, (t) =>
      this.createHostedView(t)
    );
  }

  createHostedView(tooltip: Tooltip) {
    let hostedView = tooltip.create(this.view);
    hostedView.dom.classList.add("cm-tooltip-section");
    this.dom.appendChild(hostedView.dom);
    if (this.mounted && hostedView.mount) hostedView.mount(this.view);
    return hostedView;
  }

  mount(view: EditorView) {
    for (let hostedView of this.manager.tooltipViews) {
      if (hostedView.mount) hostedView.mount(view);
    }
    this.mounted = true;
  }

  positioned() {
    for (let hostedView of this.manager.tooltipViews) {
      if (hostedView.positioned) hostedView.positioned();
    }
  }

  update(update: ViewUpdate) {
    this.manager.update(update);
  }
}

const showHoverTooltipHost = showTooltip.compute(
  [showHoverTooltip],
  (state) => {
    let tooltips = state.facet(showHoverTooltip).filter((t) => t) as Tooltip[];
    if (tooltips.length === 0) return null;

    return {
      pos: Math.min(...tooltips.map((t) => t.pos)),
      end: Math.max(
        ...tooltips.filter((t) => t.end != null).map((t) => t.end!)
      ),
      create: HoverTooltipHost.create,
      above: tooltips[0].above,
      arrow: tooltips.some((t) => t.arrow),
    };
  }
);

const enum Hover {
  Time = 300,
  MaxDist = 6,
}

class HoverPlugin {
  lastMove: { x: number; y: number; target: HTMLElement; time: number };
  hoverTimeout = -1;
  restartTimeout = -1;
  pending: { pos: number } | null = null;

  constructor(
    readonly view: EditorView,
    readonly source: (
      view: EditorView,
      pos: number,
      side: -1 | 1
    ) => Tooltip | null | Promise<Tooltip | null>,
    readonly field: StateField<Tooltip | null>,
    readonly setHover: StateEffectType<Tooltip | null>,
    readonly hoverTime: number
  ) {
    this.lastMove = { x: 0, y: 0, target: view.dom, time: 0 };
    this.checkHover = this.checkHover.bind(this);
    view.dom.addEventListener(
      "mouseleave",
      (this.mouseleave = this.mouseleave.bind(this))
    );
    view.dom.addEventListener(
      "mousemove",
      (this.mousemove = this.mousemove.bind(this))
    );
  }

  update() {
    if (this.pending) {
      this.pending = null;
      clearTimeout(this.restartTimeout);
      //@ts-ignore
      this.restartTimeout = setTimeout(() => this.startHover(), 20);
    }
  }

  get active() {
    return this.view.state.field(this.field);
  }

  checkHover() {
    this.hoverTimeout = -1;
    if (this.active) return;
    let hovered = Date.now() - this.lastMove.time;
    if (hovered < this.hoverTime)
      //@ts-ignore
      this.hoverTimeout = setTimeout(this.checkHover, this.hoverTime - hovered);
    else this.startHover();
  }

  startHover() {
    clearTimeout(this.restartTimeout);
    let { lastMove } = this;
    let pos = this.view.contentDOM.contains(lastMove.target)
      ? this.view.posAtCoords(lastMove)
      : null;
    if (pos == null) return;
    let posCoords = this.view.coordsAtPos(pos);
    if (
      posCoords == null ||
      lastMove.y < posCoords.top ||
      lastMove.y > posCoords.bottom ||
      lastMove.x < posCoords.left - this.view.defaultCharacterWidth ||
      lastMove.x > posCoords.right + this.view.defaultCharacterWidth
    )
      return;
    let bidi = this.view
      .bidiSpans(this.view.state.doc.lineAt(pos))
      .find((s) => s.from <= pos! && s.to >= pos!);
    let rtl = bidi && bidi.dir == Direction.RTL ? -1 : 1;
    let open = this.source(
      this.view,
      pos,
      (lastMove.x < posCoords.left ? -rtl : rtl) as -1 | 1
    );
    if ((open as any)?.then) {
      let pending = (this.pending = { pos });
      (open as Promise<Tooltip | null>).then(
        (result) => {
          if (this.pending == pending) {
            this.pending = null;
            if (result)
              this.view.dispatch({ effects: this.setHover.of(result) });
          }
        },
        (e) => logException(this.view.state, e, "hover tooltip")
      );
    } else if (open) {
      this.view.dispatch({ effects: this.setHover.of(open as Tooltip) });
    }
  }

  mousemove(event: MouseEvent) {
    this.lastMove = {
      x: event.clientX,
      y: event.clientY,
      target: event.target as HTMLElement,
      time: Date.now(),
    };
    if (this.hoverTimeout < 0)
      //@ts-ignore
      this.hoverTimeout = setTimeout(this.checkHover, this.hoverTime);
    let tooltip = this.active;
    if ((tooltip && !isInTooltip(this.lastMove.target)) || this.pending) {
      let { pos } = tooltip || this.pending!,
        end = tooltip?.end ?? pos;
      if (
        pos == end
          ? this.view.posAtCoords(this.lastMove) != pos
          : !isOverRange(
              this.view,
              pos,
              end,
              event.clientX,
              event.clientY,
              Hover.MaxDist
            )
      ) {
        this.view.dispatch({ effects: this.setHover.of(null) });
        this.pending = null;
      }
    }
  }

  mouseleave(e: MouseEvent) {
    clearTimeout(this.hoverTimeout);
    this.hoverTimeout = -1;
    // return;
    if (this.active && !isInTooltip(e.relatedTarget as HTMLElement))
      this.view.dispatch({ effects: this.setHover.of(null) });
  }

  destroy() {
    clearTimeout(this.hoverTimeout);
    this.view.dom.removeEventListener("mouseleave", this.mouseleave);
    this.view.dom.removeEventListener("mousemove", this.mousemove);
  }
}

function isInTooltip(elt: HTMLElement) {
  for (let cur: Node | null = elt; cur; cur = cur.parentNode)
    if (
      cur.nodeType == 1 &&
      (cur as HTMLElement).classList.contains("cm-tooltip")
    )
      return true;
  return false;
}

function isOverRange(
  view: EditorView,
  from: number,
  to: number,
  x: number,
  y: number,
  margin: number
) {
  let range = document.createRange();
  let fromDOM = view.domAtPos(from),
    toDOM = view.domAtPos(to);
  range.setEnd(toDOM.node, toDOM.offset);
  range.setStart(fromDOM.node, fromDOM.offset);
  let rects = range.getClientRects();
  range.detach();
  for (let i = 0; i < rects.length; i++) {
    let rect = rects[i];
    let dist = Math.max(
      rect.top - y,
      y - rect.bottom,
      rect.left - x,
      x - rect.right
    );
    if (dist <= margin) return true;
  }
  return false;
}

/// Enable a hover tooltip, which shows up when the pointer hovers
/// over ranges of text. The callback is called when the mouse hovers
/// over the document text. It should, if there is a tooltip
/// associated with position `pos` return the tooltip description
/// (either directly or in a promise). The `side` argument indicates
/// on which side of the position the pointer is—it will be -1 if the
/// pointer is before the position, 1 if after the position.
///
/// Note that all hover tooltips are hosted within a single tooltip
/// container element. This allows multiple tooltips over the same
/// range to be "merged" together without overlapping.
export function hoverTooltip(
  source: (
    view: EditorView,
    pos: number,
    side: -1 | 1
  ) => Tooltip | null | Promise<Tooltip | null>,
  options: {
    /// When enabled (this defaults to false), close the tooltip
    /// whenever the document changes.
    hideOnChange?: boolean;
    /// Hover time after which the tooltip should appear, in
    /// milliseconds. Defaults to 300ms.
    hoverTime?: number;
  } = {}
): Extension {
  let setHover = StateEffect.define<Tooltip | null>();
  let hoverState = StateField.define<Tooltip | null>({
    create() {
      return null;
    },

    update(value, tr) {
      if (value && options.hideOnChange && (tr.docChanged || tr.selection))
        return null;
      for (let effect of tr.effects) {
        if (effect.is(setHover)) {
          return effect.value;
        }
        if (effect.is(closeHoverTooltipEffect)) return null;
      }
      if (value && tr.docChanged) {
        let newPos = tr.changes.mapPos(value.pos, -1, MapMode.TrackDel);
        if (newPos == null) return null;
        let copy: Tooltip = Object.assign(Object.create(null), value);
        copy.pos = newPos;
        if (value.end != null) copy.end = tr.changes.mapPos(value.end);
        return copy;
      }
      return value;
    },

    provide: (f) => showHoverTooltip.from(f),
  });

  return [
    hoverState,
    ViewPlugin.define(
      (view) =>
        new HoverPlugin(
          view,
          source,
          hoverState,
          setHover,
          options.hoverTime || Hover.Time
        )
    ),
    showHoverTooltipHost,
  ];
}

/// Get the active tooltip view for a given tooltip, if available.
export function getTooltip(
  view: EditorView,
  tooltip: Tooltip
): TooltipView | null {
  let plugin = view.plugin(tooltipPlugin);
  if (!plugin) return null;
  let found = plugin.manager.tooltips.indexOf(tooltip);
  return found < 0 ? null : plugin.manager.tooltipViews[found];
}

/// Returns true if any hover tooltips are currently active.
export function hasHoverTooltips(state: EditorState) {
  return state.facet(showHoverTooltip).some((x) => x);
}

const closeHoverTooltipEffect = StateEffect.define<null>();

/// Transaction effect that closes all hover tooltips.
export const closeHoverTooltips = closeHoverTooltipEffect.of(null);

/// Tell the tooltip extension to recompute the position of the active
/// tooltips. This can be useful when something happens (such as a
/// re-positioning or CSS change affecting the editor) that could
/// invalidate the existing tooltip positions.
export function repositionTooltips(view: EditorView) {
  view.plugin(tooltipPlugin)?.maybeMeasure();
}
