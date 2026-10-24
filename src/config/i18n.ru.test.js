import fs from "fs";
import path from "path";
import { parseSync } from "@babel/core";
import { RU_I18N } from "./i18n.ru";

// i18n.test.js 的 duplicateLocaleKeys 断言只扫描 locales/ 目录，
// i18n.ru.js 在其上一层，重复键会被静默覆盖：同一键的前一条译文永远
// 不会生效。本断言把同样的守护补到俄语文案表上。
test("registers every Russian label exactly once", () => {
  const file = path.resolve(__dirname, "i18n.ru.js");
  const ast = parseSync(fs.readFileSync(file, "utf8"), {
    babelrc: false,
    configFile: false,
    parserOpts: { plugins: ["jsx"] },
  });
  const duplicates = [];
  const visit = (node) => {
    if (!node || typeof node !== "object") return;
    if (node.type === "ObjectExpression") {
      const keys = node.properties
        .filter(
          (property) => property.type === "ObjectProperty" && !property.computed
        )
        .map((property) => property.key.name || property.key.value);
      keys.forEach((key, index) => {
        if (keys.indexOf(key) !== index) duplicates.push(key);
      });
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === "object") visit(value);
    }
  };
  visit(ast);

  expect(duplicates).toEqual([]);
});

test("leaves no Russian label empty", () => {
  const empty = Object.entries(RU_I18N)
    .filter(([, text]) => typeof text !== "string" || !text.trim())
    .map(([key]) => key);

  expect(empty).toEqual([]);
});
