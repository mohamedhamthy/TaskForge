import fs from "node:fs";
import path from "node:path";
import postcss from "postcss";
import selectorParser from "postcss-selector-parser";
import { parse } from "@babel/parser";

const rootDir = path.resolve(import.meta.dirname, "..");
const sourceDir = path.join(rootDir, "src");
const styleFiles = ["src/App.css", "src/styles/auth.css"];
const classUtilities = new Map();
const rawClassUtilities = new Map();
const bodyUtilities = new Set();
const rootUtilities = new Set();
const missingClasses = new Set();
const dynamicStyles = {
  color: ["coral", "sky", "lilac", "mint"],
  tone: ["slate", "amber", "blue", "violet", "green"],
  priority: ["low", "medium", "high", "urgent"],
  status: ["backlog", "todo", "progress", "review", "done"],
  avatar: ["coral", "sky", "lilac", "mint"],
  message: ["error", "success"],
};

const encodeValue = (value) => value.trim().replace(/\s+/g, "_");
const arbitraryUtility = (property, value) =>
  `[${property}:${encodeValue(value)}]`;

function addUtilities(map, key, values) {
  if (!map.has(key)) map.set(key, new Set());
  for (const value of values) map.get(key).add(value);
}

function mediaVariant(params) {
  const match = params.match(/\(\s*(max|min)-width\s*:\s*([^)]+)\)/);
  return match ? `${match[1]}-[${match[2].trim()}]` : null;
}

function darkPrefix(selector) {
  const match = selector.match(/^html\[data-theme\s*=\s*["']?dark["']?\]\s*/);
  return match
    ? { enabled: true, selector: selector.slice(match[0].length).trim() }
    : { enabled: false, selector };
}

function candidateFor(property, value, variants) {
  const utility = arbitraryUtility(property, value);
  return `${variants.length ? `${variants.join(":")}:` : ""}${utility}`;
}

function processSelector(selectorText, declarations, variants) {
  const trimmed = selectorText.trim();
  if (trimmed === ":root") {
    for (const declaration of declarations) {
      const target = declaration.prop.startsWith("--")
        ? bodyUtilities
        : bodyUtilities;
      target.add(candidateFor(declaration.prop, declaration.value, variants));
    }
    return;
  }

  const dark = darkPrefix(trimmed);
  const selector = dark.selector;
  const activeVariants = dark.enabled ? [...variants, "dark"] : variants;
  if (!selector && dark.enabled) {
    for (const declaration of declarations)
      bodyUtilities.add(
        candidateFor(declaration.prop, declaration.value, activeVariants),
      );
    return;
  }
  const parsed = selectorParser().astSync(selector);
  const classes = [];
  parsed.walkClasses((node) => classes.push(node.value));

  if (classes.length) {
    const className = classes.at(-1);
    const classSelector = `.${className}`;
    const classIndex = selector.lastIndexOf(classSelector);
    const relativeSelector =
      `${selector.slice(0, classIndex)}&${selector.slice(classIndex + classSelector.length)}`
        .replace(/\.calendar-view\b/g, "[data-view=calendar]")
        .replace(/\.overview-view\b/g, "[data-view=overview]");
    const utilityValues = declarations.map((declaration) =>
      arbitraryUtility(declaration.prop, declaration.value),
    );
    addUtilities(rawClassUtilities, className, utilityValues);
    const selectorVariant =
      relativeSelector === "&"
        ? []
        : [`[${relativeSelector.replace(/\s+/g, "_")}]`];
    const modifiers = [...activeVariants, ...selectorVariant];
    addUtilities(
      classUtilities,
      className,
      declarations.map((declaration) =>
        candidateFor(declaration.prop, declaration.value, modifiers),
      ),
    );
    return;
  }

  if (selector === "#root") {
    for (const declaration of declarations)
      rootUtilities.add(
        candidateFor(declaration.prop, declaration.value, activeVariants),
      );
    return;
  }
  if (selector === "body") {
    for (const declaration of declarations)
      bodyUtilities.add(
        candidateFor(declaration.prop, declaration.value, activeVariants),
      );
    return;
  }

  const relativeSelector = selector === "*" ? "&>*" : `& ${selector}`;
  const selectorVariant = `[${relativeSelector.replace(/\s+/g, "_")}]`;
  for (const declaration of declarations) {
    bodyUtilities.add(
      candidateFor(declaration.prop, declaration.value, [
        ...activeVariants,
        selectorVariant,
      ]),
    );
  }
}

function visitCss(node, variants = []) {
  node.each((child) => {
    if (child.type === "atrule") {
      if (child.name === "media") {
        const variant = mediaVariant(child.params);
        if (!variant)
          throw new Error(`Unsupported media query: ${child.params}`);
        visitCss(child, [...variants, variant]);
      }
      return;
    }
    if (child.type !== "rule") return;
    const declarations = child.nodes.filter((item) => item.type === "decl");
    const selectors = selectorParser().astSync(child.selector);
    selectors.each((selector) =>
      processSelector(selector.toString(), declarations, variants),
    );
  });
}

for (const file of styleFiles) {
  const css = fs.readFileSync(path.join(rootDir, file), "utf8");
  visitCss(postcss.parse(css, { from: file }));
}

function utilitiesForClass(className) {
  return [...(classUtilities.get(className) || [])].join(" ");
}

function transformClassText(text) {
  return text
    .split(/(\s+)/)
    .map((part) => {
      if (!part || /^\s+$/.test(part)) return part;
      const replacement = utilitiesForClass(part);
      if (!replacement) {
        if (part === "auth-loading")
          return "grid min-h-screen place-items-center bg-[#f7f7f4] text-[#88878b] text-[12px] font-sans";
        if (
          [
            "calendar-view",
            "overview-view",
            "primary-nav",
            "column-dot",
            "temporary-password-message",
            "workspace-create-modal",
          ].includes(part)
        )
          return "";
        missingClasses.add(part);
        return "";
      }
      return replacement;
    })
    .join("");
}

function walk(node, callback, parent = null) {
  if (!node || typeof node !== "object") return;
  callback(node, parent);
  for (const [key, value] of Object.entries(node)) {
    if (key === "loc" || key === "tokens" || key === "comments") continue;
    if (Array.isArray(value))
      value.forEach((child) => walk(child, callback, node));
    else if (
      value &&
      typeof value === "object" &&
      typeof value.type === "string"
    )
      walk(value, callback, node);
  }
}

function allClassAttributes(ast) {
  const result = [];
  walk(ast, (node) => {
    if (node.type === "JSXOpeningElement") result.push(node);
  });
  return result;
}

function transformDynamicExpression(expression, precedingText) {
  const source = expression.__source || "";
  if (/^\[\s*["']coral["']\s*,/.test(source))
    return `dynamicStyles.color[${source}]`;
  if (/^(item|task)\.color$/.test(source)) {
    if (precedingText.endsWith("avatar-"))
      return `dynamicStyles.avatar[${source}.slice(0)]`;
    return `dynamicStyles.color[${source}]`;
  }
  if (/^column\.tone$/.test(source)) return `dynamicStyles.tone[${source}]`;
  if (/^task\.priority\.toLowerCase\(\)$/.test(source))
    return `dynamicStyles.priority[${source}]`;
  if (/^task\.status$/.test(source)) return `dynamicStyles.status[${source}]`;
  if (/^message\.type$/.test(source)) return `dynamicStyles.message[${source}]`;
  return null;
}

function transformClassExpression(
  expression,
  source,
  edits,
  needsDynamicImport,
) {
  if (!expression) return needsDynamicImport;
  if (expression.type === "StringLiteral") {
    edits.push({
      start: expression.start,
      end: expression.end,
      text: JSON.stringify(transformClassText(expression.value)),
    });
    return needsDynamicImport;
  }
  if (expression.type === "TemplateLiteral") {
    expression.expressions.forEach((templateExpression, index) => {
      const quasi = expression.quasis[index];
      const sourceText = source.slice(
        templateExpression.start,
        templateExpression.end,
      );
      templateExpression.__source = sourceText;
      let precedingText = quasi.value.raw;
      let replacement = transformDynamicExpression(
        templateExpression,
        precedingText,
      );
      if (replacement?.startsWith("dynamicStyles")) {
        if (
          /^(item|task)\.color$/.test(sourceText) &&
          precedingText.endsWith("avatar-")
        ) {
          precedingText = precedingText.slice(0, -7);
        }
        edits.push({
          start: quasi.start,
          end: quasi.end,
          text: transformClassText(precedingText),
        });
        edits.push({
          start: templateExpression.start,
          end: templateExpression.end,
          text: replacement,
        });
        needsDynamicImport = true;
      } else {
        edits.push({
          start: quasi.start,
          end: quasi.end,
          text: transformClassText(quasi.value.raw),
        });
        needsDynamicImport = transformClassExpression(
          templateExpression,
          source,
          edits,
          needsDynamicImport,
        );
      }
    });
    const finalQuasi = expression.quasis.at(-1);
    if (finalQuasi.value.raw)
      edits.push({
        start: finalQuasi.start,
        end: finalQuasi.end,
        text: transformClassText(finalQuasi.value.raw),
      });
    return needsDynamicImport;
  }
  if (expression.type === "ConditionalExpression") {
    needsDynamicImport = transformClassExpression(
      expression.consequent,
      source,
      edits,
      needsDynamicImport,
    );
    return transformClassExpression(
      expression.alternate,
      source,
      edits,
      needsDynamicImport,
    );
  }
  if (expression.type === "LogicalExpression")
    return transformClassExpression(
      expression.right,
      source,
      edits,
      needsDynamicImport,
    );
  return needsDynamicImport;
}

function dynamicObjectSource() {
  const groups = Object.entries(dynamicStyles).map(([group, keys]) => {
    const entries = keys.map((key) => {
      const className = group === "avatar" ? `avatar-${key}` : key;
      const utilities = [...(rawClassUtilities.get(className) || [])];
      if (!utilities.length)
        throw new Error(`No styles found for dynamic class ${className}`);
      return `    ${JSON.stringify(key)}: ${JSON.stringify(utilities.join(" "))},`;
    });
    return `  ${group}: {\n${entries.join("\n")}\n  },`;
  });
  return `export const dynamicStyles = {\n${groups.join("\n")}\n}\n`;
}

function transformJsxFile(file, dryRun) {
  const absolutePath = path.join(rootDir, file);
  const source = fs.readFileSync(absolutePath, "utf8");
  const ast = parse(source, { sourceType: "module", plugins: ["jsx"] });
  const edits = [];
  let needsDynamicImport = false;
  let removedCssImport = false;

  for (const node of allClassAttributes(ast)) {
    let classAttribute = node.attributes.find(
      (attribute) =>
        attribute.type === "JSXAttribute" &&
        attribute.name.name === "className",
    );
    const styleAttribute = node.attributes.find(
      (attribute) =>
        attribute.type === "JSXAttribute" && attribute.name.name === "style",
    );
    let styleUtilities = [];

    if (
      styleAttribute?.value?.type === "JSXExpressionContainer" &&
      styleAttribute.value.expression.type === "ObjectExpression"
    ) {
      for (const property of styleAttribute.value.expression.properties) {
        if (property.type !== "ObjectProperty") continue;
        const key = property.key.name || property.key.value;
        const cssProperty = key.replace(
          /[A-Z]/g,
          (character) => `-${character.toLowerCase()}`,
        );
        const value =
          property.value.type === "StringLiteral"
            ? property.value.value
            : property.value.type === "NumericLiteral"
              ? String(property.value.value)
              : null;
        if (value !== null)
          styleUtilities.push(arbitraryUtility(cssProperty, value));
      }
      edits.push({
        start: styleAttribute.start,
        end: styleAttribute.end,
        text: "",
      });
    }

    if (classAttribute?.value?.type === "StringLiteral") {
      const transformed =
        `${transformClassText(classAttribute.value.value)} ${styleUtilities.join(" ")}`.trim();
      edits.push({
        start: classAttribute.value.start,
        end: classAttribute.value.end,
        text: JSON.stringify(transformed),
      });
    } else if (classAttribute?.value?.type === "JSXExpressionContainer") {
      const expression = classAttribute.value.expression;
      needsDynamicImport = transformClassExpression(
        expression,
        source,
        edits,
        needsDynamicImport,
      );
      if (styleUtilities.length) {
        const lastQuasi =
          expression.type === "TemplateLiteral"
            ? expression.quasis.at(-1)
            : null;
        if (lastQuasi)
          edits.push({
            start: lastQuasi.end,
            end: lastQuasi.end,
            text: ` ${styleUtilities.join(" ")}`,
          });
        else if (classAttribute.value.expression.type === "StringLiteral") {
          edits.push({
            start: classAttribute.value.expression.start,
            end: classAttribute.value.expression.end,
            text: JSON.stringify(
              `${transformClassText(classAttribute.value.expression.value)} ${styleUtilities.join(" ")}`.trim(),
            ),
          });
        }
      }
    } else if (styleUtilities.length) {
      edits.push({
        start: node.end - 1,
        end: node.end - 1,
        text: ` className=${JSON.stringify(styleUtilities.join(" "))}`,
      });
    }
  }

  walk(ast, (node) => {
    if (
      node.type === "ImportDeclaration" &&
      node.source.value.endsWith(".css") &&
      node.source.value !== "./index.css"
    ) {
      edits.push({ start: node.start, end: node.end, text: "" });
      removedCssImport = true;
    }
  });

  if (needsDynamicImport) {
    const imports = ast.program.body.filter(
      (node) => node.type === "ImportDeclaration",
    );
    const lastImport = imports.at(-1);
    const relative = path
      .relative(
        path.dirname(absolutePath),
        path.join(sourceDir, "tailwindStyles.js"),
      )
      .replaceAll(path.sep, "/");
    edits.push({
      start: lastImport.end,
      end: lastImport.end,
      text: `\nimport { dynamicStyles } from ${JSON.stringify(relative.startsWith(".") ? relative : `./${relative}`)};`,
    });
  }

  let output = source;
  edits.sort((left, right) => right.start - left.start || right.end - left.end);
  for (const edit of edits)
    output = output.slice(0, edit.start) + edit.text + output.slice(edit.end);
  if (!dryRun && output !== source) fs.writeFileSync(absolutePath, output);
  return { file, edits: edits.length, needsDynamicImport, removedCssImport };
}

const jsxFiles = [];
function listJsx(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) listJsx(absolutePath);
    else if (entry.isFile() && entry.name.endsWith(".jsx"))
      jsxFiles.push(path.relative(rootDir, absolutePath));
  }
}
listJsx(sourceDir);

const dryRun = process.argv.includes("--dry-run");
const results = jsxFiles.map((file) => transformJsxFile(file, dryRun));
const bodyClass = [...bodyUtilities].join(" ");
const rootClass = [...rootUtilities].join(" ");
const dynamicSource = dynamicObjectSource();

console.log(
  JSON.stringify(
    {
      dryRun,
      transformedFiles: results,
      classSelectors: classUtilities.size,
      unmappedClasses: [...missingClasses],
      bodyUtilities: bodyUtilities.size,
      rootUtilities: rootUtilities.size,
      bodyClass,
      rootClass,
      dynamicStyleBytes: dynamicSource.length,
    },
    null,
    2,
  ),
);

if (!dryRun) {
  fs.writeFileSync(path.join(sourceDir, "tailwindStyles.js"), dynamicSource);
  const indexPath = path.join(rootDir, "index.html");
  let html = fs.readFileSync(indexPath, "utf8");
  html = html.replace(
    /<body class="([^"]*)">/,
    (_, classes) => `<body class="${classes} ${bodyClass}">`,
  );
  html = html.replace(
    /<div id="root" class="([^"]*)">/,
    (_, classes) => `<div id="root" class="${classes} ${rootClass}">`,
  );
  fs.writeFileSync(indexPath, html);
  for (const file of styleFiles) fs.unlinkSync(path.join(rootDir, file));
}
