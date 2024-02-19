<h1 align="center">
	<br>
		<img src="docs/logo.png" style="aspect-ratio: 1 / 1; max-width: 300px;" alt="logo image for the rust test highlight vscode extension depicting a cartoon crab working at a computer terminal with some of the code it is typing displayed in the background, partially highlighted so that the bottom half of it stands out more than the top half">
	<br>
	Rust Test Highlight
	<br>
	<br>
</h1>

<p align="center">Highlight your inline Rust tests with a customizable background color so they stand out in your editor.</p>

---

## Demo

https://github.com/andrewbrey/rust-test-highlight/assets/34140052/93fa6660-f4f5-4dc5-8680-e312a3c28d68

## Motivation and How it Works

Inline test modules in Rust are usually pretty great, but when working in large files it is pretty easy to lose track of where your test code starts and your application code ends. It's not _that_ hard to scan around for the nearest `#[test]` annotation, but the fact is that _it does often take some scanning_ to re-obtain your bearings as you fly around your code.

That's why I created the `Rust Test Highlight` extension to automatically apply a customizable background color to inline test modules. That way, as you zip through your file you'll be able to quickly distinguish between your test code and your code under test.

Once installed, the extension will automatically activate whenever you open a file with the `rust` language mode, and apply your chosen highlight color (or the defaults if you don't care to customize it) to the inline `tests` module in your open editors.

As of now, this is the extent of the test code that is highlighted, and free `#[test]` functions that are not part of a `mod tests` are not highlighted. This is for the simple reason that using a `tests` module is recommended [by the Rust documentation](https://doc.rust-lang.org/book/ch11-03-test-organization.html#the-tests-module-and-cfgtest). Further, integration tests (or in general, tests which aren't part of an inline module and are in a file that is already well-identified as being test code because the file is called, for example `test.rs`) are not highlighted. In short, the goal of this extension is to make it easier to spot inline tests, and it encourages the use of the `tests` module convention when doing so.

### Examples Of Highlighting Scenarios

```rust
// add.rs
pub fn add() {}

// ✅ the following code would be highlighted
#[cfg(test)]
mod tests {
  #[test]
  fn test_add() {}
}
```

```rust
// add.rs
pub fn add() {}

// ❌ the following code **would not** be highlighted
//    (wrong test module name)
#[cfg(test)]
mod unit_tests {
  #[test]
  fn test_add() {}
}
```

```rust
// add.rs
pub fn add() {}

// ❌ the following code **would not** be highlighted
//    (test not part of a "tests" module)
#[test]
fn test_add() {}
```

```rust
// test.rs
use crate::add;

// ❌ the following code **would not** be highlighted
//    (test not part of a "tests" module and well
//     identified as a test by the file it's in)
#[test]
fn test_add() {}
```

## Installation

**Install using Command Palette**

1. Go to View -> Command Palette or press Ctrl+Shift+P
2. Then enter "Install Extension
3. Enter "Rust Test Highlight"
4. Select it or press Enter to install

## Customizing Highlight Color

```jsonc
// user `settings.json` (or in the workspace .vscode/settings.json)
"workbench.colorCustomizations": {
  "rustTestHighlight.backgroundColor": "#2813491c"
}
```

Note that any color recognized as a color by VS Code's settings parsing will work, so `rgb`, `rgba`, `hex` and `hex with alpha` all will work just fine, and it's recommended that you _do include_ an alpha value (ideally, a pretty low one) so that the highlight doesn't interfere with other decorations, color themes, or syntax highlighting.

## License

[MIT License](./LICENSE)
