import type { Component } from "../tui.js";
import { truncateToWidth, visibleWidth } from "../utils.js";

/**
 * A component that renders two components side by side with a separator.
 * The right component has a fixed width, and the left component takes the rest.
 */
export class HorizontalSplit implements Component {
	private left: Component;
	private right: Component;
	private rightWidth: number;
	private separator: string;
	private separatorStyle: (s: string) => string;

	/**
	 * Create a horizontal split layout.
	 * @param left - The main content component (takes remaining width)
	 * @param right - The sidebar component (fixed width)
	 * @param rightWidth - Width of the right component in columns
	 * @param separator - Separator character (default: "│")
	 * @param separatorStyle - Optional function to style the separator
	 */
	constructor(
		left: Component,
		right: Component,
		rightWidth: number,
		separator = "│",
		separatorStyle: (s: string) => string = (s) => s,
	) {
		this.left = left;
		this.right = right;
		this.rightWidth = rightWidth;
		this.separator = separator;
		this.separatorStyle = separatorStyle;
	}

	setRightWidth(width: number): void {
		this.rightWidth = width;
	}

	invalidate(): void {
		this.left.invalidate?.();
		this.right.invalidate?.();
	}

	render(width: number): string[] {
		// If terminal is too narrow, just render left component
		const minWidth = this.rightWidth + 3; // separator + minimal left content
		if (width < minWidth) {
			return this.left.render(width);
		}

		const separatorWidth = visibleWidth(this.separator);
		const leftWidth = width - this.rightWidth - separatorWidth;

		// Render both components
		const leftLines = this.left.render(leftWidth);
		const rightLines = this.right.render(this.rightWidth);

		// Combine lines side by side
		const maxLines = Math.max(leftLines.length, rightLines.length);
		const result: string[] = [];

		for (let i = 0; i < maxLines; i++) {
			const leftLine = i < leftLines.length ? leftLines[i] : "";
			const rightLine = i < rightLines.length ? rightLines[i] : "";

			// Pad left line to exact width
			const leftVisible = visibleWidth(leftLine);
			const leftPadded =
				leftVisible < leftWidth
					? leftLine + " ".repeat(leftWidth - leftVisible)
					: truncateToWidth(leftLine, leftWidth);

			// Pad right line to exact width
			const rightVisible = visibleWidth(rightLine);
			const rightPadded =
				rightVisible < this.rightWidth
					? rightLine + " ".repeat(this.rightWidth - rightVisible)
					: truncateToWidth(rightLine, this.rightWidth);

			result.push(leftPadded + this.separatorStyle(this.separator) + rightPadded);
		}

		return result;
	}
}
