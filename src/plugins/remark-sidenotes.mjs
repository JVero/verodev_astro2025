import { visit, SKIP } from 'unist-util-visit';

const SIDENOTE_REF_RE = /\(\((\d+)\)\)/g;

function attr(name, value) {
  return { type: 'mdxJsxAttribute', name, value };
}

function supRefNode(num) {
  return {
    type: 'mdxJsxTextElement',
    name: 'sup',
    attributes: [
      attr('class', 'sidenote-ref'),
      attr('data-note', String(num)),
      attr('role', 'doc-noteref'),
      attr('aria-describedby', `sidenote-${num}`),
      attr('tabindex', '0'),
    ],
    children: [{ type: 'text', value: String(num) }],
    data: { _mdxExplicitJsx: true },
  };
}

export default function remarkSidenotes() {
  return (tree) => {
    const sidenotes = new Map();
    const referencedNums = new Set();

    // Pass 1: Collect sidenote code blocks, remove from tree
    visit(tree, 'code', (node, index, parent) => {
      if (node.lang === 'sidenote' && node.meta) {
        const num = parseInt(node.meta.trim(), 10);
        if (!isNaN(num)) {
          sidenotes.set(num, node.value.replace(/\n$/, ''));
          parent.children.splice(index, 1);
          return [SKIP, index];
        }
      }
    });

    if (sidenotes.size === 0) return;

    // Pass 2: Transform ((N)) in text nodes
    visit(tree, 'text', (node, index, parent) => {
      if (!parent || !Array.isArray(parent.children)) return;
      // Skip text inside code blocks
      if (parent.type === 'code' || parent.type === 'inlineCode') return;
      if (!SIDENOTE_REF_RE.test(node.value)) return;
      SIDENOTE_REF_RE.lastIndex = 0;

      const parts = [];
      let lastIdx = 0;
      let match;
      while ((match = SIDENOTE_REF_RE.exec(node.value)) !== null) {
        if (match.index > lastIdx) {
          parts.push({ type: 'text', value: node.value.slice(lastIdx, match.index) });
        }
        const num = parseInt(match[1], 10);
        referencedNums.add(num);
        parts.push(supRefNode(num));
        lastIdx = SIDENOTE_REF_RE.lastIndex;
      }
      if (lastIdx < node.value.length) {
        parts.push({ type: 'text', value: node.value.slice(lastIdx) });
      }
      parent.children.splice(index, 1, ...parts);
      return [SKIP, index + parts.length];
    });

    // Pass 3: Inject sidenote container (only referenced — orphans filtered)
    const sorted = [...sidenotes.entries()]
      .filter(([num]) => referencedNums.has(num))
      .sort((a, b) => a[0] - b[0]);

    if (sorted.length === 0) return;

    // Build aside elements. Content is stored as raw text — client JS
    // applies inlineMarkdownToHtml() before display.
    const asideElements = sorted.map(([num, content]) => ({
      type: 'mdxJsxFlowElement',
      name: 'aside',
      attributes: [
        attr('class', 'sidenote'),
        attr('id', `sidenote-${num}`),
        attr('data-note', String(num)),
        attr('data-content', content),
        attr('role', 'doc-footnote'),
        attr('aria-label', `Sidenote ${num}`),
      ],
      children: [],
      data: { _mdxExplicitJsx: true },
    }));

    tree.children.push({
      type: 'mdxJsxFlowElement',
      name: 'div',
      attributes: [
        attr('class', 'sidenotes-container'),
      ],
      children: asideElements,
      data: { _mdxExplicitJsx: true },
    });
  };
}
