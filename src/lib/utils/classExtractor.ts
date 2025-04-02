interface ClassDefinition {
	name: string;
	inheritance: string;
	content: string;
	docstring: string;
}

export class ClassExtractor {
	private classPattern = /^\s*class\s+(\w+)\s*(?:\((.*?)\))?:\s*$/gm;
	private docstringPattern = /^\s*"""(.*?)"""/gms;
	private indentPattern = /^(\s*)/gm;

	stripComments(content: string): string {
		// Ensure content is a string and not undefined
		if (typeof content !== 'string') {
			console.warn('stripComments received non-string input');
			return '';
		}

		const stringStates = {
			singleQuote: false,
			doubleQuote: false,
			tripleSingleQuote: false,
			tripleDoubleQuote: false
		};

		const result: string[] = [];
		let i = 0;

		while (i < content.length) {
			const char = content[i];

			// String state management
			if (char === "'" && !stringStates.doubleQuote && !stringStates.tripleDoubleQuote) {
				if (content.slice(i, i + 3) === "'''") {
					stringStates.tripleSingleQuote = !stringStates.tripleSingleQuote;
					result.push("'''");
					i += 3;
					continue;
				} else {
					stringStates.singleQuote = !stringStates.singleQuote;
				}
			} else if (char === '"' && !stringStates.singleQuote && !stringStates.tripleSingleQuote) {
				if (content.slice(i, i + 3) === '"""') {
					stringStates.tripleDoubleQuote = !stringStates.tripleDoubleQuote;
					result.push('"""');
					i += 3;
					continue;
				} else {
					stringStates.doubleQuote = !stringStates.doubleQuote;
				}
			}

			// Comment handling
			if (
				char === '#' &&
				!stringStates.singleQuote &&
				!stringStates.doubleQuote &&
				!stringStates.tripleSingleQuote &&
				!stringStates.tripleDoubleQuote
			) {
				// Skip to end of line
				while (i < content.length && content[i] !== '\n') {
					i++;
				}
				// Keep the newline
				if (i < content.length) {
					result.push('\n');
					i++;
				}
				continue;
			}

			result.push(char);
			i++;
		}

		return result.join('');
	}

	extractClasses(
		fileContent: string | undefined,
		includeComments: boolean = true
	): ClassDefinition[] {
		// Handle undefined or null input
		if (!fileContent) {
			console.warn('extractClasses received undefined or null input');
			return [];
		}

		// Strip comments if needed
		const processedContent = includeComments ? fileContent : this.stripComments(fileContent);

		const classes: ClassDefinition[] = [];

		// Use safe match method
		const matches = processedContent.match(this.classPattern) || [];

		// Iterate through matches safely
		Array.from(matches).forEach((matchStr, index) => {
			const match = this.classPattern.exec(matchStr);

			if (!match) return;

			const className = match[1] || '';
			const classInheritance = match[2] || '';

			// Reset lastIndex to avoid issues with global regex
			this.classPattern.lastIndex = 0;

			// Determine class content boundaries
			const startPos = processedContent.indexOf(matchStr);
			const endPos =
				index < matches.length - 1
					? processedContent.indexOf(matches[index + 1] || '', startPos)
					: processedContent.length;

			const classContent = processedContent.slice(startPos, endPos);

			// Extract docstring safely
			const docstringMatch = classContent.match(this.docstringPattern);
			const docstring = docstringMatch ? (docstringMatch[1] || '').trim() : '';

			classes.push({
				name: className,
				inheritance: classInheritance,
				content: classContent,
				docstring: docstring
			});
		});

		return classes;
	}
}
