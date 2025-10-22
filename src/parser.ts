
export type TestModuleSpan = {
  startLine: number,
  startColumn: number,
  endLine: number,
  endColumn: number,
}


export function clamp(num: number, min?: number, max?: number): number {
  if (min != null && num < min) {
    return min;
  }

  if (max != null && num > max) {
    return max;
  }

  return num;
}

export function findVitestBlocks(text: string): Array<TestModuleSpan> {
  const blocks: Array<TestModuleSpan> = [];

  // Pattern to match: if (import.meta.vitest) {
  // This captures the if block start to the opening brace
  const pattern = /if\s*\(\s*import\s*\.\s*meta\s*\.\s*vitest\s*\)\s*\{/g;

  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) != null) {
    // Calculate line and column from the character position
    const startPos = match.index;
    const startLine = text.substring(0, startPos).split("\n").length - 1;
    const lastLineBreak = text.lastIndexOf("\n", startPos);
    const startColumn =
      lastLineBreak === -1 ? startPos : startPos - lastLineBreak - 1;

    // Find the closing brace for this if block
    let braceCount = 1;
    let endPos = match.index + match[0].length;

    // Use Array.from and findIndex to find closing brace
    const textAfterStart = text.substring(endPos);
    const closingIndex = Array.from(textAfterStart).findIndex(
      (char: string) => {
        if (char === "{") {
          braceCount++;
        } else if (char === "}") {
          braceCount--;
        }
        return braceCount === 0;
      }
    );

    if (closingIndex !== -1) {
      endPos = endPos + closingIndex + 1;
    }

    // Calculate end line and column
    const endLine = text.substring(0, endPos).split("\n").length - 1;
    const lastLineBreakEnd = text.lastIndexOf("\n", endPos - 1);
    const endColumn =
      lastLineBreakEnd === -1 ? endPos : endPos - lastLineBreakEnd - 1;

    blocks.push({
      startLine,
      startColumn,
      endLine,
      endColumn,
    });
  }

  return blocks;
}


// Finds all `mod tests` blocks in Rust code (but NOT `mod not_tests`).
// Returns an array of span information for each block found.
export function findRustTestModules(text: string): Array<TestModuleSpan> {
  const blocks: Array<TestModuleSpan> = [];

  // Pattern to match: mod tests { (but not mod not_tests or other variants)
  // This uses a negative lookbehind to ensure "tests" is not preceded by "not_"
  const pattern = /\bmod\s+tests\s*\{/g;

  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) != null) {
    // Calculate line and column from the character position
    const startPos = match.index;
    const startLine = text.substring(0, startPos).split("\n").length - 1;
    const lastLineBreak = text.lastIndexOf("\n", startPos);
    const startColumn =
      lastLineBreak === -1 ? startPos : startPos - lastLineBreak - 1;

    // Find the closing brace for this module block
    let braceCount = 1;
    let endPos = match.index + match[0].length;

    // Use Array.from and findIndex to find closing brace
    const textAfterStart = text.substring(endPos);
    const closingIndex = Array.from(textAfterStart).findIndex(
      (char: string) => {
        if (char === "{") {
          braceCount++;
        } else if (char === "}") {
          braceCount--;
        }
        return braceCount === 0;
      }
    );

    if (closingIndex !== -1) {
      endPos = endPos + closingIndex + 1;
    }

    // Calculate end line and column
    const endLine = text.substring(0, endPos).split("\n").length - 1;
    const lastLineBreakEnd = text.lastIndexOf("\n", endPos - 1);
    const endColumn =
      lastLineBreakEnd === -1 ? endPos : endPos - lastLineBreakEnd - 1;

    blocks.push({
      startLine,
      startColumn,
      endLine,
      endColumn,
    });
  }

  return blocks;
}

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("clamp", () => {
    it("clamps values correctly", () => {
      const testCases = [
        { input: [5], expected: 5 },
        { input: [-10], expected: -10 },
        { input: [0], expected: 0 },
        { input: [3, 5], expected: 5 },
        { input: [-20, -10], expected: -10 },
        { input: [10, undefined, 5], expected: 5 },
        { input: [20, undefined, 15], expected: 15 },
        { input: [3, 5, 10], expected: 5 },
        { input: [15, 5, 10], expected: 10 },
        { input: [7, 5, 10], expected: 7 },
        { input: [0, -5, 5], expected: 0 },
        { input: [0, 1, 10], expected: 1 },
        { input: [0, -10, -1], expected: -1 },
      ];

      const results = testCases.map((testCase) => {
        const result = clamp(
          testCase.input[0] as number,
          testCase.input[1] as number | undefined,
          testCase.input[2] as number | undefined,
        );
        return {
          input: testCase.input,
          expected: testCase.expected,
          actual: result,
          passed: result === testCase.expected,
        };
      });

      expect(results).toMatchSnapshot();
    });
  });

  describe("findVitestBlocks", () => {
    it("finds single vitest block", () => {
      const code = `if (import.meta.vitest) {
  console.log('test');
}`;
      const blocks = findVitestBlocks(code);
      expect(blocks).toMatchSnapshot();
    });

    it("finds multiple vitest blocks", () => {
      const code = `if (import.meta.vitest) {
  describe('suite 1', () => {
    it('test 1', () => {});
  });
}

if (import.meta.vitest) {
  describe('suite 2', () => {
    it('test 2', () => {});
  });
}`;
      const blocks = findVitestBlocks(code);
      expect(blocks).toMatchSnapshot();
    });

    it("handles nested braces in vitest block", () => {
      const code = `if (import.meta.vitest) {
  describe('suite', () => {
    it('test', () => {
      expect(true).toBe(true);
    });
  });
}`;
      const blocks = findVitestBlocks(code);
      expect(blocks).toMatchSnapshot();
    });

    it("finds vitest block with whitespace variations", () => {
      const code = `if  (  import  .  meta  .  vitest  )  {
  // test
}`;
      const blocks = findVitestBlocks(code);
      expect(blocks).toMatchSnapshot();
    });

    it("returns empty array when no vitest blocks found", () => {
      const code = `function add(a, b) {
  return a + b;
}`;
      const blocks = findVitestBlocks(code);
      expect(blocks).toEqual([]);
    });

    it("correctly calculates line and column positions", () => {
      const code = `export function test() {}

if (import.meta.vitest) {
  it('test', () => {});
}`;
      const blocks = findVitestBlocks(code);
      expect(blocks).toHaveLength(1);
      expect(blocks.at(0)?.startLine).toBe(2); // Third line (0-indexed)
      expect(blocks.at(0)?.startColumn).toBe(0);
    });

    it("handles vitest block at start of file", () => {
      const code = `if (import.meta.vitest) {
  it('test', () => {});
}`;
      const blocks = findVitestBlocks(code);
      expect(blocks).toMatchSnapshot();
    });

    it("handles vitest block at end of file", () => {
      const code = `export function test() {}

if (import.meta.vitest) {
  it('test', () => {});
}`;
      const blocks = findVitestBlocks(code);
      expect(blocks).toMatchSnapshot();
    });
  });

  describe("findRustTestModules", () => {
    it("finds single mod tests block", () => {
      const code = `#[cfg(test)]
mod tests {
  #[test]
  fn test() {}
}`;
      const blocks = findRustTestModules(code);
      expect(blocks).toMatchSnapshot();
    });

    it("finds multiple mod tests blocks", () => {
      const code = `#[cfg(test)]
mod tests {
  #[test]
  fn test1() {}
}

mod nested {
  #[cfg(test)]
  mod tests {
    #[test]
    fn test2() {}
  }
}`;
      const blocks = findRustTestModules(code);
      expect(blocks).toMatchSnapshot();
    });

    it("ignores mod not_tests blocks", () => {
      const code = `#[cfg(test)]
mod not_tests {
  #[test]
  fn test() {}
}

#[cfg(test)]
mod tests {
  #[test]
  fn real_test() {}
}`;
      const blocks = findRustTestModules(code);
      expect(blocks).toHaveLength(1);
      expect(blocks.at(0)?.startLine).toBe(7);
    });

    it("handles nested braces in mod tests", () => {
      const code = `#[cfg(test)]
mod tests {
  #[test]
  fn test() {
    assert_eq!(2 + 2, 4);
    {
      let x = 5;
    }
  }
}`;
      const blocks = findRustTestModules(code);
      expect(blocks).toMatchSnapshot();
    });

    it("returns empty array when no mod tests found", () => {
      const code = `pub fn add(a: i32, b: i32) -> i32 {
  a + b
}`;
      const blocks = findRustTestModules(code);
      expect(blocks).toEqual([]);
    });

    it("finds mod tests at start of file", () => {
      const code = `mod tests {
  #[test]
  fn test() {}
}`;
      const blocks = findRustTestModules(code);
      expect(blocks).toMatchSnapshot();
    });

    it("finds mod tests at end of file", () => {
      const code = `pub fn add(a: i32, b: i32) -> i32 {
  a + b
}

mod tests {
  #[test]
  fn test() {}
}`;
      const blocks = findRustTestModules(code);
      expect(blocks).toMatchSnapshot();
    });
  });

  describe("sample code", () => {
    it("parses Rust sample code and captures all test modules", async () => {
      const { getSampleRustCode } = await import("./sample");
      const rustCode = getSampleRustCode();
      const blocks = findRustTestModules(rustCode);
      expect(blocks).toMatchSnapshot();
    });

    it("parses TypeScript sample code and captures all vitest blocks", async () => {
      const { getSampleTypeScriptCode } = await import("./sample");
      const tsCode = getSampleTypeScriptCode();
      const blocks = findVitestBlocks(tsCode);
      expect(blocks).toMatchSnapshot();
    });
  });
}

