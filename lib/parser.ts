export interface Frontmatter {
  title?: string;
  date?: string;
  readtime?: string;
  tags?: string[];
  excerpt?: string;
  [key: string]: any;
}

/**
 * Extracts YAML-like frontmatter block from the beginning of an MDX file content.
 */
export function parseFrontmatter(content: string): Frontmatter {
  const frontmatter: Frontmatter = {};
  const trimmed = content.trim();
  
  if (!trimmed.startsWith("---")) {
    return frontmatter;
  }

  const lines = trimmed.split("\n");
  let inFrontmatter = false;
  let currentKey: string | null = null;
  let arrayValues: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line === "---") {
      if (!inFrontmatter) {
        inFrontmatter = true;
        continue;
      } else {
        // Closed frontmatter block
        break;
      }
    }

    if (!inFrontmatter) continue;

    // Check if line is part of a list (starts with "- ") under a key
    if (line.startsWith("- ") && currentKey) {
      const val = line.substring(2).replace(/['"]/g, "").trim();
      if (val) {
        arrayValues.push(val);
        frontmatter[currentKey] = arrayValues;
      }
      continue;
    }

    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;

    const key = line.substring(0, colonIndex).trim();
    let value = line.substring(colonIndex + 1).trim();

    // Clean surrounding quotes
    value = value.replace(/^['"]|['"]$/g, "");

    currentKey = key;

    if (value.startsWith("[") && value.endsWith("]")) {
      // Inline array: [A, B, C]
      const items = value
        .substring(1, value.length - 1)
        .split(",")
        .map((item) => item.replace(/['"]/g, "").trim())
        .filter(Boolean);
      frontmatter[key] = items;
      arrayValues = items;
    } else if (value === "") {
      // Bulleted list starts on next line
      arrayValues = [];
      frontmatter[key] = arrayValues;
    } else {
      // String value
      frontmatter[key] = value;
    }
  }

  return frontmatter;
}
