/**
 * Sidebar component that displays file changes during a session.
 */

import type { Component } from "@mariozechner/pi-tui";
import { theme } from "../theme/theme.js";

export interface FileChange {
	path: string;
	type: "created" | "modified" | "read";
	linesAdded?: number;
	linesRemoved?: number;
	timestamp: number;
}

/**
 * Sidebar component showing file changes.
 */
export class FileChangesSidebar implements Component {
	private changes: FileChange[] = [];
	private title = "Files";

	invalidate(): void {
		// No cache to invalidate
	}

	/**
	 * Add or update a file change entry.
	 */
	addChange(change: FileChange): void {
		// Check if file already exists in changes
		const existing = this.changes.find((c) => c.path === change.path);
		if (existing) {
			// Update existing entry
			if (change.type === "created" || change.type === "modified") {
				existing.type = change.type === "created" && existing.type === "modified" ? "modified" : change.type;
				existing.linesAdded = (existing.linesAdded || 0) + (change.linesAdded || 0);
				existing.linesRemoved = (existing.linesRemoved || 0) + (change.linesRemoved || 0);
			}
			existing.timestamp = change.timestamp;
		} else {
			this.changes.push(change);
		}
		// Sort by most recent first
		this.changes.sort((a, b) => b.timestamp - a.timestamp);
	}

	/**
	 * Clear all tracked changes.
	 */
	clear(): void {
		this.changes = [];
	}

	/**
	 * Get the number of tracked files.
	 */
	getFileCount(): number {
		return this.changes.length;
	}

	render(width: number): string[] {
		const lines: string[] = [];

		// Title
		const titleText = ` ${this.title} `;
		const titlePadding = Math.max(0, width - titleText.length);
		const leftPad = Math.floor(titlePadding / 2);
		const rightPad = titlePadding - leftPad;
		lines.push(theme.bold(theme.fg("accent", "─".repeat(leftPad) + titleText + "─".repeat(rightPad))));
		lines.push("");

		if (this.changes.length === 0) {
			lines.push(theme.fg("muted", " No changes yet"));
			return lines;
		}

		// Show file changes
		for (const change of this.changes) {
			// Get just the filename, not full path
			const filename = change.path.split("/").pop() || change.path;

			// Icon and color based on type
			let icon: string;
			let nameColor: (s: string) => string;
			switch (change.type) {
				case "created":
					icon = theme.fg("success", "+");
					nameColor = (s) => theme.fg("success", s);
					break;
				case "modified":
					icon = theme.fg("warning", "~");
					nameColor = (s) => theme.fg("warning", s);
					break;
				case "read":
					icon = theme.fg("dim", "○");
					nameColor = (s) => theme.fg("dim", s);
					break;
			}

			// Truncate filename if needed (leave room for icon and stats)
			const maxNameLen = width - 10;
			const displayName = filename.length > maxNameLen ? `${filename.slice(0, maxNameLen - 1)}…` : filename;

			const line = ` ${icon} ${nameColor(displayName)}`;

			// Add line stats for created/modified files
			if ((change.type === "created" || change.type === "modified") && (change.linesAdded || change.linesRemoved)) {
				const stats: string[] = [];
				if (change.linesAdded) {
					stats.push(theme.fg("success", `+${change.linesAdded}`));
				}
				if (change.linesRemoved) {
					stats.push(theme.fg("error", `-${change.linesRemoved}`));
				}
				if (stats.length > 0) {
					lines.push(line);
					lines.push(`   ${stats.join(" ")}`);
					continue;
				}
			}

			lines.push(line);
		}

		return lines;
	}
}
