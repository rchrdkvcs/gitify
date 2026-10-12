import { test } from "@japa/runner";
import { absolutizeMarkdown } from "../../inertia/utils/markdown.js";

const repo = { ownerName: "owner", name: "repo", branch: "main" };

test.group("README links", () => {
  test("resolves relative images and documents on GitHub", ({ assert }) => {
    const source = [
      "![logo](./docs/logo.png)",
      "[guide](docs/GUIDE.md)",
      '<img src="assets/banner.svg" width="200">',
      '<a href="LICENSE">license</a>',
    ].join("\n");
    assert.equal(
      absolutizeMarkdown(source, repo),
      [
        "![logo](https://raw.githubusercontent.com/owner/repo/main/docs/logo.png)",
        "[guide](https://github.com/owner/repo/blob/main/docs/GUIDE.md)",
        '<img src="https://raw.githubusercontent.com/owner/repo/main/assets/banner.svg" width="200">',
        '<a href="https://github.com/owner/repo/blob/main/LICENSE">license</a>',
      ].join("\n"),
    );
  });

  test("keeps absolute URLs, anchors and mail links", ({ assert }) => {
    const source = "[a](https://x.dev) [b](#install) [c](mailto:a@b.c) ![d](//cdn.dev/i.png)";
    assert.equal(absolutizeMarkdown(source, repo), source);
  });
});
