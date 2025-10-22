export function getSampleRustCode(): string {
  return `


// cool comment but not part of the module

mod nested {
	pub fn add() {}

	mod nested_again {
		/*

		some comments



		*/

		#[cfg(test)]
		mod not_tests {
				#[test]
				fn test() {

				}
		}

		/// nested docs
		/// wooooo
		#[cfg(test)]
		mod tests {
				#[test]
				fn test() {

				}
		}
	}

	#[cfg(test)]
	mod tests {
			#[test]
			fn test() {

			}
	}
}

/// some docs
///
///
/// wooo
#[cfg(test)]
mod tests {
		#[test]
		fn test() {

		}
}
		`;
}

export function getSampleTypeScriptCode(): string {
  return `// Sample TypeScript file with vitest blocks

export function add(a: number, b: number): number {
	return a + b;
}

export function subtract(a: number, b: number): number {
	return a - b;
}

if (import.meta.vitest) {
	describe('add function', () => {
		it('adds two positive numbers', () => {
			expect(add(2, 3)).toBe(5);
		});

		it('adds negative numbers', () => {
			expect(add(-1, -2)).toBe(-3);
		});
	});
}

// Some other stuff
function multiply(a: number, b: number): number {
	return a * b;
}

if (import.meta.vitest) {
	describe('subtract function', () => {
		it('subtracts two numbers', () => {
			expect(subtract(5, 3)).toBe(2);
		});

		it('handles negative results', () => {
			expect(subtract(1, 5)).toBe(-4);
		});
	});
}
`;
}
